import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

export default function WhatsAppChat({ jid, phone, contactName, messages, onSend, onBack }) {
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(jid, trimmed);
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const displayName = contactName || phone || jid?.replace('@s.whatsapp.net', '');

    return (
        <div className="wa-chat">
            {/* Chat Header */}
            <div className="wa-chat-header">
                <button className="wa-chat-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div className="wa-chat-header-avatar">
                    {(displayName || '?')[0]?.toUpperCase()}
                </div>
                <div className="wa-chat-header-info">
                    <span className="wa-chat-header-name">{displayName}</span>
                    {phone && <span className="wa-chat-header-phone">{phone}</span>}
                </div>
            </div>

            {/* Messages */}
            <div className="wa-chat-messages">
                {messages.length === 0 ? (
                    <div className="wa-chat-empty">
                        <p>Nenhuma mensagem ainda</p>
                        <p className="wa-chat-empty-sub">Envie uma mensagem para iniciar a conversa</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={msg.id || i}
                            className={`wa-msg ${msg.fromMe ? 'wa-msg-sent' : 'wa-msg-received'}`}
                        >
                            <div className="wa-msg-bubble">
                                {!msg.fromMe && msg.pushName && (
                                    <span className="wa-msg-sender">{msg.pushName}</span>
                                )}
                                <span className="wa-msg-text">{msg.text}</span>
                                <span className="wa-msg-time">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="wa-chat-input">
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="wa-chat-textarea"
                />
                <button
                    className="wa-chat-send"
                    onClick={handleSend}
                    disabled={!text.trim()}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
