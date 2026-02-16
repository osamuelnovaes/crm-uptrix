import { useState, useEffect, useCallback } from 'react';
import {
    X, MessageCircle, Smartphone, Search, Phone, User,
    Wifi, WifiOff, Loader, LogOut
} from 'lucide-react';
import WhatsAppChat from './WhatsAppChat';
import * as ws from '../utils/whatsappSocket';

export default function WhatsAppPanel({ phone, leads, onClose, mode = 'sidebar' }) {
    const [socketStatus, setSocketStatus] = useState('connecting'); // connecting | connected | reconnecting
    const [waStatus, setWaStatus] = useState('disconnected'); // disconnected | qr | connected
    const [qrCode, setQrCode] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // { jid, phone, name }
    const [chatMessages, setChatMessages] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Connect socket on mount
    useEffect(() => {
        ws.connectSocket();

        const unsubs = [
            ws.on('socket-connected', () => {
                setSocketStatus('connected');
            }),
            ws.on('socket-error', () => {
                setSocketStatus('reconnecting');
            }),
            ws.on('socket-disconnected', () => {
                setSocketStatus('connecting');
            }),
            ws.on('connection-status', (status) => {
                setWaStatus(status);
                if (status === 'connected') {
                    setQrCode(null);
                    ws.getChats();
                }
            }),
            ws.on('qr', (dataUrl) => {
                setQrCode(dataUrl);
            }),
            ws.on('user-info', (info) => {
                setUserInfo(info);
            }),
            ws.on('chats-list', (list) => {
                setChats(list || []);
            }),
            ws.on('chat-messages', ({ jid, messages }) => {
                setChatMessages(prev => ({ ...prev, [jid]: messages }));
            }),
            ws.on('chat-opened', ({ jid, phone: p, messages }) => {
                setChatMessages(prev => ({ ...prev, [jid]: messages }));
                setActiveChat({ jid, phone: p, name: p });
            }),
            ws.on('new-message', (msg) => {
                const jid = msg.jid;
                setChatMessages(prev => {
                    const existing = prev[jid] || [];
                    // Avoid duplicates
                    if (existing.find(m => m.id === msg.id)) return prev;
                    return { ...prev, [jid]: [...existing, msg] };
                });
                // Update chat list
                ws.getChats();
            }),
            ws.on('send-error', (err) => {
                console.error('Erro ao enviar:', err);
            }),
        ];

        return () => {
            unsubs.forEach(u => u && u());
        };
    }, []);

    // Open chat by phone when provided from CRM lead
    useEffect(() => {
        if (phone && waStatus === 'connected') {
            ws.openChatByPhone(phone);
        }
    }, [phone, waStatus]);

    const handleOpenChat = useCallback((chat) => {
        setActiveChat({ jid: chat.jid, phone: chat.phone, name: chat.name });
        ws.getMessages(chat.jid);
    }, []);

    const handleSendMessage = useCallback((jid, text) => {
        ws.sendMessage(jid, text);
    }, []);

    const handleBack = useCallback(() => {
        setActiveChat(null);
    }, []);

    const handleDisconnect = useCallback(() => {
        ws.disconnectWhatsApp();
        setWaStatus('disconnected');
        setQrCode(null);
        setChats([]);
        setActiveChat(null);
        setChatMessages({});
        setUserInfo(null);
    }, []);

    // Merge CRM leads with phone into contacts (when no WA chats)
    const crmContacts = (leads || [])
        .filter(l => l.telefone)
        .map(l => ({
            jid: l.telefone.replace(/\D/g, '') + '@s.whatsapp.net',
            name: l.nome || l.telefone,
            phone: l.telefone.replace(/\D/g, ''),
            isGroup: false,
            unreadCount: 0,
            lastMessage: '',
            timestamp: 0,
            isCrmLead: true,
        }));

    // Combine WA chats + CRM contacts (WA chats first, then CRM leads not in WA)
    const allContacts = waStatus === 'connected'
        ? [
            ...chats,
            ...crmContacts.filter(c => !chats.find(ch => ch.jid === c.jid)),
        ]
        : crmContacts;

    const filteredContacts = searchTerm
        ? allContacts.filter(c => {
            const t = searchTerm.toLowerCase();
            return (c.name && c.name.toLowerCase().includes(t))
                || (c.phone && c.phone.includes(t));
        })
        : allContacts;

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    // ─── Server connecting / reconnecting ───
    if (socketStatus === 'connecting' || socketStatus === 'reconnecting') {
        return (
            <div className={`whatsapp-panel ${mode === 'full' ? 'full-mode' : ''}`}>
                <div className="whatsapp-panel-header">
                    <div className="whatsapp-panel-title">
                        <MessageCircle size={20} />
                        <h2>WhatsApp</h2>
                    </div>
                    <button className="whatsapp-panel-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="wa-status-screen">
                    <Loader size={48} className="spin" />
                    <h3>Conectando ao servidor...</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', maxWidth: '260px' }}>O servidor pode levar até 1 minuto para iniciar na primeira vez.</p>
                    <button className="wa-retry-btn" onClick={() => ws.connectSocket()} style={{ marginTop: '12px' }}>
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // ─── Active chat view ───
    if (activeChat) {
        const messages = chatMessages[activeChat.jid] || [];
        return (
            <div className={`whatsapp-panel ${mode === 'full' ? 'full-mode' : ''}`}>
                <WhatsAppChat
                    jid={activeChat.jid}
                    phone={activeChat.phone}
                    contactName={activeChat.name}
                    messages={messages}
                    onSend={handleSendMessage}
                    onBack={handleBack}
                />
            </div>
        );
    }

    return (
        <div className={`whatsapp-panel ${mode === 'full' ? 'full-mode' : ''}`}>
            {/* Header */}
            <div className="whatsapp-panel-header">
                <div className="whatsapp-panel-title">
                    <MessageCircle size={20} />
                    <h2>WhatsApp</h2>
                    <span className={`whatsapp-status-badge ${waStatus === 'connected' ? 'connected' : ''}`}>
                        {waStatus === 'connected' ? 'Conectado' : waStatus === 'qr' ? 'Aguardando QR' : 'Desconectado'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {waStatus === 'connected' && (
                        <button className="wa-disconnect-btn" onClick={handleDisconnect} title="Desconectar WhatsApp">
                            <LogOut size={16} />
                        </button>
                    )}
                    <button className="whatsapp-panel-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* QR Code Screen */}
            {(waStatus === 'qr' || waStatus === 'disconnected') && (
                <div className="wa-qr-section">
                    {qrCode ? (
                        <>
                            <div className="wa-qr-container">
                                <img src={qrCode} alt="QR Code WhatsApp" className="wa-qr-image" />
                            </div>
                            <div className="wa-qr-instructions">
                                <Smartphone size={16} />
                                <div>
                                    <p><strong>Escaneie o QR Code</strong></p>
                                    <p className="wa-qr-step">1. Abra o WhatsApp no celular</p>
                                    <p className="wa-qr-step">2. Toque em Configurações &gt; Dispositivos conectados</p>
                                    <p className="wa-qr-step">3. Toque em "Conectar dispositivo"</p>
                                    <p className="wa-qr-step">4. Aponte a câmera para o QR Code</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="wa-qr-loading">
                            <Loader size={32} className="spin" />
                            <p>Gerando QR Code...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Connected: User Info */}
            {waStatus === 'connected' && userInfo && (
                <div className="wa-user-info">
                    <Wifi size={14} />
                    <span>Conectado como <strong>{userInfo.name}</strong></span>
                </div>
            )}

            {/* Connected: Search + Contacts */}
            {waStatus === 'connected' && (
                <>
                    <div className="whatsapp-search">
                        <Search size={15} className="whatsapp-search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar contato..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="whatsapp-search-input"
                        />
                    </div>

                    <div className="whatsapp-contacts-list">
                        {filteredContacts.length === 0 ? (
                            <div className="whatsapp-empty">
                                <Phone size={24} />
                                <p>{searchTerm ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}</p>
                            </div>
                        ) : (
                            filteredContacts.map(chat => (
                                <button
                                    key={chat.jid}
                                    className="whatsapp-contact-item"
                                    onClick={() => handleOpenChat(chat)}
                                >
                                    <div className="whatsapp-contact-avatar">
                                        {chat.isGroup ? '#' : <User size={16} />}
                                    </div>
                                    <div className="whatsapp-contact-info">
                                        <div className="whatsapp-contact-row">
                                            <span className="whatsapp-contact-name">{chat.name}</span>
                                            {chat.timestamp > 0 && (
                                                <span className="whatsapp-contact-time">{formatTime(chat.timestamp)}</span>
                                            )}
                                        </div>
                                        {chat.lastMessage && (
                                            <span className="whatsapp-contact-last-msg">{chat.lastMessage}</span>
                                        )}
                                        {!chat.lastMessage && chat.phone && (
                                            <span className="whatsapp-contact-phone">
                                                <Phone size={11} />
                                                {chat.phone}
                                            </span>
                                        )}
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <span className="whatsapp-unread-badge">{chat.unreadCount}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
