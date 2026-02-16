import { io } from 'socket.io-client';

// Automatically use Render URL in production (GitHub Pages) or localhost in dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://crm-uptrix-008.onrender.com');

let socket = null;
let listeners = {};

/**
 * Conecta ao servidor WhatsApp backend.
 */
export function connectSocket() {
    if (socket) return socket;

    socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 60000,
    });

    socket.on('connect', () => {
        console.log('✅ Conectado ao servidor WhatsApp');
        emit('socket-connected');
    });

    socket.on('connect_error', () => {
        emit('socket-error');
    });

    socket.on('disconnect', () => {
        emit('socket-disconnected');
    });

    // Forward all WhatsApp events
    socket.on('qr', (data) => emit('qr', data));
    socket.on('connection-status', (data) => emit('connection-status', data));
    socket.on('user-info', (data) => emit('user-info', data));
    socket.on('chats-list', (data) => emit('chats-list', data));
    socket.on('chat-messages', (data) => emit('chat-messages', data));
    socket.on('chat-opened', (data) => emit('chat-opened', data));
    socket.on('new-message', (data) => emit('new-message', data));
    socket.on('send-error', (data) => emit('send-error', data));

    return socket;
}

/**
 * Desconecta do servidor.
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Registra um listener.
 */
export function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    };
}

/**
 * Remove todos os listeners de um evento.
 */
export function off(event) {
    delete listeners[event];
}

/**
 * Emits to internal listeners.
 */
function emit(event, data) {
    const cbs = listeners[event];
    if (cbs) cbs.forEach(cb => cb(data));
}

/**
 * Envia um evento para o backend.
 */
export function sendToServer(event, data) {
    if (socket?.connected) {
        socket.emit(event, data);
    }
}

// Shortcuts
export const getChats = () => sendToServer('get-chats');
export const getMessages = (jid) => sendToServer('get-messages', { jid });
export const sendMessage = (jid, text) => sendToServer('send-message', { jid, text });
export const openChatByPhone = (phone) => sendToServer('open-chat', { phone });
export const disconnectWhatsApp = () => sendToServer('disconnect-whatsapp');
