import { useState, useRef, useCallback, useEffect } from 'react';
import { X, MessageCircle, ExternalLink, QrCode, Smartphone, Search, Phone, User } from 'lucide-react';
import { formatPhoneForWhatsApp } from '../utils/whatsapp';

/**
 * WhatsApp Panel – painel lateral integrado ao CRM.
 * Abre o WhatsApp Web em uma popup controlada posicionada ao lado do CRM.
 */
export default function WhatsAppPanel({ phone, leads, onClose, onSelectLead }) {
    const [popupRef, setPopupRef] = useState(null);
    const [connected, setConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const popupInterval = useRef(null);

    // Leads com telefone
    const leadsWithPhone = (leads || []).filter(l => l.telefone);

    const filteredLeads = searchTerm
        ? leadsWithPhone.filter(l => {
            const term = searchTerm.toLowerCase();
            return (
                (l.nome && l.nome.toLowerCase().includes(term)) ||
                (l.telefone && l.telefone.includes(term)) ||
                (l.empresa && l.empresa.toLowerCase().includes(term))
            );
        })
        : leadsWithPhone;

    const openWhatsAppPopup = useCallback((targetPhone) => {
        const formatted = targetPhone ? formatPhoneForWhatsApp(targetPhone) : '';
        const url = formatted
            ? `https://wa.me/${formatted}`
            : 'https://web.whatsapp.com';

        // Calculate popup position (right side of screen)
        const popupWidth = 420;
        const popupHeight = window.screen.availHeight - 100;
        const popupLeft = window.screen.availWidth - popupWidth - 20;
        const popupTop = 50;

        const features = `width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=no`;

        // Close existing popup if open
        if (popupRef && !popupRef.closed) {
            popupRef.location.href = url;
        } else {
            const popup = window.open(url, 'whatsapp_crm', features);
            setPopupRef(popup);
            setConnected(true);
        }
    }, [popupRef]);

    // Auto-open when phone is provided
    useEffect(() => {
        if (phone) {
            openWhatsAppPopup(phone);
        }
    }, [phone]); // eslint-disable-line react-hooks/exhaustive-deps

    // Monitor popup close
    useEffect(() => {
        if (popupRef) {
            popupInterval.current = setInterval(() => {
                if (popupRef.closed) {
                    setPopupRef(null);
                    setConnected(false);
                    clearInterval(popupInterval.current);
                }
            }, 1000);
        }
        return () => {
            if (popupInterval.current) clearInterval(popupInterval.current);
        };
    }, [popupRef]);

    // Clean up popup on unmount
    useEffect(() => {
        return () => {
            if (popupInterval.current) clearInterval(popupInterval.current);
        };
    }, []);

    const handleLeadClick = (lead) => {
        openWhatsAppPopup(lead.telefone);
        if (onSelectLead) onSelectLead(lead);
    };

    const handleOpenGeneral = () => {
        openWhatsAppPopup(null);
    };

    const getDisplayName = (lead) => {
        if (lead.nome) return lead.nome;
        if (lead.telefone) return lead.telefone;
        if (lead.email) return lead.email;
        return `Lead #${lead.id}`;
    };

    return (
        <div className="whatsapp-panel">
            {/* Header */}
            <div className="whatsapp-panel-header">
                <div className="whatsapp-panel-title">
                    <MessageCircle size={20} />
                    <h2>WhatsApp</h2>
                    <span className={`whatsapp-status-badge ${connected ? 'connected' : ''}`}>
                        {connected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
                <button className="whatsapp-panel-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            {/* Connect Section */}
            <div className="whatsapp-connect-section">
                <button className="whatsapp-connect-btn" onClick={handleOpenGeneral}>
                    <QrCode size={18} />
                    <span>{connected ? 'Abrir WhatsApp Web' : 'Conectar WhatsApp'}</span>
                    <ExternalLink size={14} />
                </button>
                {!connected && (
                    <p className="whatsapp-connect-hint">
                        <Smartphone size={13} />
                        Clique para abrir o WhatsApp Web e escanear o QR Code
                    </p>
                )}
            </div>

            {/* Search */}
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

            {/* Contacts List */}
            <div className="whatsapp-contacts-list">
                {filteredLeads.length === 0 ? (
                    <div className="whatsapp-empty">
                        <Phone size={24} />
                        <p>{searchTerm ? 'Nenhum contato encontrado' : 'Nenhum lead com telefone cadastrado'}</p>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <button
                            key={lead.id}
                            className="whatsapp-contact-item"
                            onClick={() => handleLeadClick(lead)}
                        >
                            <div className="whatsapp-contact-avatar">
                                <User size={16} />
                            </div>
                            <div className="whatsapp-contact-info">
                                <span className="whatsapp-contact-name">{getDisplayName(lead)}</span>
                                <span className="whatsapp-contact-phone">
                                    <Phone size={11} />
                                    {lead.telefone}
                                </span>
                                {lead.empresa && (
                                    <span className="whatsapp-contact-empresa">{lead.empresa}</span>
                                )}
                            </div>
                            <div className="whatsapp-contact-action">
                                <MessageCircle size={16} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
