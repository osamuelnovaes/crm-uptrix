import { useState } from 'react';
import { Phone, Mail, Building2, GripVertical, User, Trash2, Check, X, MessageCircle } from 'lucide-react';
import { getStage } from '../utils/stages';
import { WA_STATUS_COLORS, openWhatsAppWeb } from '../utils/whatsapp';

function getDisplayName(lead) {
    if (lead.nome) return lead.nome;
    if (lead.telefone) return lead.telefone;
    if (lead.email) return lead.email;
    return `Lead #${lead.id}`;
}

export default function LeadCard({ lead, onClick, onDelete, onDragStart, onDragEnd, onOpenWhatsApp }) {
    const stage = getStage(lead.stage);
    const [isDeleting, setIsDeleting] = useState(false);

    const waStatus = lead.whatsappStatus || 'nao_enviado';
    const waColor = WA_STATUS_COLORS[waStatus] || '#ef4444';

    // reset delete state if mouse leaves card
    const handleMouseLeave = () => {
        if (isDeleting) setIsDeleting(false);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (isDeleting) {
            onDelete(lead.id);
        } else {
            setIsDeleting(true);
        }
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setIsDeleting(false);
    };

    const handleDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(lead.id);
    };

    const handleWhatsAppClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (lead.telefone) {
            openWhatsAppWeb(lead.telefone);
        }
    };

    return (
        <div
            className="lead-card"
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onClick(lead)}
            onMouseLeave={handleMouseLeave}
            style={{
                borderLeft: `3px solid ${stage.color}`,
                cursor: 'grab',
                opacity: isDeleting ? 0.9 : 1
            }}
        >
            <div className="lead-card-header">
                <div className="lead-card-grip">
                    <GripVertical size={14} />
                </div>
                <h4 className="lead-card-name">{getDisplayName(lead)}</h4>

                <div className="lead-card-actions">
                    {lead.telefone && (
                        <button
                            className="lead-card-whatsapp"
                            onClick={handleWhatsAppClick}
                            title="Abrir WhatsApp"
                        >
                            <MessageCircle size={13} />
                            <span
                                className="wa-status-dot"
                                style={{ backgroundColor: waColor }}
                            />
                        </button>
                    )}

                    {isDeleting ? (
                        <div className="delete-confirm-actions">
                            <button
                                className="lead-card-delete confirm"
                                onClick={handleDeleteClick}
                                title="Confirmar exclusão"
                                style={{ color: '#ef4444', background: '#fee2e2' }}
                            >
                                <Check size={13} />
                            </button>
                            <button
                                className="lead-card-delete cancel"
                                onClick={handleCancelDelete}
                                title="Cancelar"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <button className="lead-card-delete" onClick={handleDeleteClick} title="Excluir lead">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div className="lead-card-info">
                {lead.telefone && (
                    <span
                        className="lead-card-detail lead-card-phone-link"
                        onClick={handleWhatsAppClick}
                        title="Abrir no WhatsApp"
                    >
                        <Phone size={12} />
                        {lead.telefone}
                    </span>
                )}
                {lead.email && (
                    <span className="lead-card-detail">
                        <Mail size={12} />
                        {lead.email}
                    </span>
                )}
                {lead.empresa && (
                    <span className="lead-card-detail">
                        <Building2 size={12} />
                        {lead.empresa}
                    </span>
                )}
            </div>

            {lead.vendedor && (
                <div className="lead-card-vendedor">
                    <User size={12} />
                    <span>{lead.vendedor}</span>
                </div>
            )}

            {lead.valorProposta > 0 && (
                <div className="lead-card-value">
                    R$ {Number(lead.valorProposta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
            )}
        </div>
    );
}
