import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    delay,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { useSupabaseAuthState } from './auth_supabase.js';
import { makeInMemoryStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

// ─── State ──────────────────────────────────────
let sock = null;
let connectionState = 'disconnected'; // disconnected | qr | connected
let qrDataUrl = null;
const store = makeInMemoryStore({});
const AUTH_DIR = path.join(__dirname, 'auth_info');

// ─── WhatsApp Connection ────────────────────────
async function startWhatsApp() {
    let state, saveCreds;

    // Check if using Supabase for auth
    const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

    if (useSupabase) {
        console.log('☁️ Usando Supabase para autenticação persistente');
        const auth = await useSupabaseAuthState(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        state = auth.state;
        saveCreds = auth.saveCreds;
    } else {
        console.log('📂 Usando sistema de arquivos local para autenticação');
        const fileAuth = await useMultiFileAuthState(AUTH_DIR);
        state = fileAuth.state;
        saveCreds = fileAuth.saveCreds;
    }

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60000,
    });

    store.bind(sock.ev);

    // Connection updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            connectionState = 'qr';
            try {
                qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
            } catch {
                qrDataUrl = null;
            }
            io.emit('qr', qrDataUrl);
            io.emit('connection-status', connectionState);
            console.log('📱 QR Code gerado — escaneie no CRM');
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            connectionState = 'disconnected';
            qrDataUrl = null;
            io.emit('connection-status', connectionState);

            if (reason === DisconnectReason.loggedOut) {
                console.log('🔴 Desconectado — sessão removida');

                // Only remove local folder if NOT using Supabase
                // (Supabase cleanup is handled by removing rows, which Baileys usually does,
                // or we can manually invoke it if needed, but file deletion would crash here)
                if (!process.env.SUPABASE_URL && fs.existsSync(AUTH_DIR)) {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                }

                await delay(2000);
                startWhatsApp();
            } else {
                console.log(`🔄 Reconectando... (razão: ${reason})`);
                await delay(3000);
                startWhatsApp();
            }
        }

        if (connection === 'open') {
            connectionState = 'connected';
            qrDataUrl = null;
            io.emit('connection-status', connectionState);

            // Send user info
            const me = sock.user;
            io.emit('user-info', {
                id: me?.id,
                name: me?.name || me?.notify || 'WhatsApp',
            });
            console.log('🟢 WhatsApp conectado!');
        }
    });

    // Save credentials
    sock.ev.on('creds.update', saveCreds);

    // Incoming messages
    sock.ev.on('messages.upsert', (msg) => {
        const messages = msg.messages;
        if (!messages || msg.type !== 'notify') return;

        for (const m of messages) {
            if (m.key.fromMe === false || m.key.fromMe === true) {
                const jid = m.key.remoteJid;
                if (!jid || jid === 'status@broadcast') continue;

                const parsed = parseMessage(m);
                if (parsed) {
                    io.emit('new-message', parsed);
                }
            }
        }
    });
}

// ─── Message Parser ─────────────────────────────
function parseMessage(msg) {
    const jid = msg.key.remoteJid;
    const isGroup = jid?.endsWith('@g.us');
    const phone = jid?.replace('@s.whatsapp.net', '').replace('@g.us', '');

    let text = '';
    const m = msg.message;
    if (m?.conversation) text = m.conversation;
    else if (m?.extendedTextMessage?.text) text = m.extendedTextMessage.text;
    else if (m?.imageMessage?.caption) text = `📷 ${m.imageMessage.caption || 'Imagem'}`;
    else if (m?.imageMessage) text = '📷 Imagem';
    else if (m?.videoMessage) text = '🎥 Vídeo';
    else if (m?.audioMessage) text = '🎤 Áudio';
    else if (m?.documentMessage) text = `📄 ${m.documentMessage.fileName || 'Documento'}`;
    else if (m?.stickerMessage) text = '🎨 Sticker';
    else if (m?.contactMessage) text = `👤 ${m.contactMessage.displayName || 'Contato'}`;
    else if (m?.locationMessage) text = '📍 Localização';
    else text = '💬 Mensagem';

    return {
        id: msg.key.id,
        jid,
        phone,
        isGroup,
        fromMe: msg.key.fromMe || false,
        pushName: msg.pushName || '',
        text,
        timestamp: msg.messageTimestamp
            ? (typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp : msg.messageTimestamp.low) * 1000
            : Date.now(),
    };
}

// ─── Get chats list ─────────────────────────────
function getChats() {
    const allChats = store.chats?.all?.() || [];
    return allChats
        .filter(c => c.id && !c.id.includes('status@broadcast'))
        .sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0))
        .slice(0, 100)
        .map(c => ({
            jid: c.id,
            name: c.name || c.notify || c.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
            phone: c.id.replace('@s.whatsapp.net', '').replace('@g.us', ''),
            isGroup: c.id.endsWith('@g.us'),
            unreadCount: c.unreadCount || 0,
            lastMessage: c.lastMessage?.message?.conversation
                || c.lastMessage?.message?.extendedTextMessage?.text
                || '',
            timestamp: c.conversationTimestamp
                ? (typeof c.conversationTimestamp === 'number' ? c.conversationTimestamp : c.conversationTimestamp.low) * 1000
                : 0,
        }));
}

// ─── Socket.IO Events ───────────────────────────
io.on('connection', (socket) => {
    console.log('🔌 Frontend conectado');

    // Send current state immediately
    socket.emit('connection-status', connectionState);
    if (qrDataUrl) socket.emit('qr', qrDataUrl);
    if (connectionState === 'connected' && sock?.user) {
        socket.emit('user-info', {
            id: sock.user.id,
            name: sock.user.name || sock.user.notify || 'WhatsApp',
        });
    }

    // Frontend requests chat list
    socket.on('get-chats', () => {
        const chats = getChats();
        socket.emit('chats-list', chats);
    });

    // Frontend requests messages for a specific chat
    socket.on('get-messages', async ({ jid }) => {
        try {
            const messages = store.messages[jid]?.array?.slice(-50) || [];
            const parsed = messages.map(parseMessage).filter(Boolean);
            socket.emit('chat-messages', { jid, messages: parsed });
        } catch (err) {
            console.error('Error loading messages:', err);
            socket.emit('chat-messages', { jid, messages: [] });
        }
    });

    // Frontend sends a message
    socket.on('send-message', async ({ jid, text }) => {
        if (!sock || connectionState !== 'connected') {
            socket.emit('send-error', 'WhatsApp não está conectado');
            return;
        }

        try {
            // If jid doesn't have the suffix, add it
            let targetJid = jid;
            if (!targetJid.includes('@')) {
                targetJid = targetJid + '@s.whatsapp.net';
            }

            const sent = await sock.sendMessage(targetJid, { text });
            const parsed = parseMessage(sent);
            if (parsed) {
                io.emit('new-message', parsed);
            }
        } catch (err) {
            console.error('Error sending message:', err.message);
            socket.emit('send-error', err.message);
        }
    });

    // Frontend opens a chat by phone number (from CRM lead)
    socket.on('open-chat', async ({ phone }) => {
        const cleaned = phone.replace(/\D/g, '');
        const jid = cleaned + '@s.whatsapp.net';

        try {
            const messages = store.messages[jid]?.array?.slice(-50) || [];
            const parsed = messages.map(parseMessage).filter(Boolean);
            socket.emit('chat-opened', {
                jid,
                phone: cleaned,
                messages: parsed,
            });
        } catch (err) {
            socket.emit('chat-opened', {
                jid,
                phone: cleaned,
                messages: [],
            });
        }
    });

    // Disconnect WhatsApp
    socket.on('disconnect-whatsapp', async () => {
        if (sock) {
            await sock.logout();
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Frontend desconectado');
    });
});

// ─── REST Endpoints ─────────────────────────────
app.get('/', (req, res) => {
    res.send('🚀 Servidor WhatsApp Online!');
});

app.get('/status', (req, res) => {
    res.json({
        status: connectionState,
        user: connectionState === 'connected' ? sock?.user : null,
        mode: process.env.SUPABASE_URL ? 'Cloud (Supabase)' : 'Local',
    });
});

// ─── Start ──────────────────────────────────────
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor WhatsApp rodando em http://localhost:${PORT}`);
    console.log('📡 Aguardando conexão do CRM...\n');
    startWhatsApp();
});
