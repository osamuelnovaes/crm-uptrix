import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

let socket = null;
let listeners = {};

/**
 * Conecta ao servidor WhatsApp backend.
 */
export function connectSocket() {
    if (socket?.connected) return socket;

    socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
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
