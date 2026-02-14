import { Phone, Mail, Building2, GripVertical, User, Trash2 } from 'lucide-react';
import { getStage } from '../utils/stages';

function getDisplayName(lead) {
    if (lead.nome) return lead.nome;
    if (lead.telefone) return lead.telefone;
    if (lead.email) return lead.email;
    return `Lead #${lead.id}`;
}

export default function LeadCard({ lead, onClick, onDelete, provided }) {
    const stage = getStage(lead.stage);

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm('Excluir este lead?')) {
            onDelete(lead.id);
        }
    };

    return (
        <div
            className="lead-card"
            onClick={() => onClick(lead)}
            ref={provided?.innerRef}
            {...provided?.draggableProps}
            {...provided?.dragHandleProps}
            style={{
                ...provided?.draggableProps?.style,
                borderLeft: `3px solid ${stage.color}`,
            }}
        >
            <div className="lead-card-header">
                <div className="lead-card-grip">
                    <GripVertical size={14} />
                </div>
                <h4 className="lead-card-name">{getDisplayName(lead)}</h4>
                <button className="lead-card-delete" onClick={handleDelete} title="Excluir lead">
                    <Trash2 size={13} />
                </button>
            </div>

            <div className="lead-card-info">
                {lead.telefone && (
                    <span className="lead-card-detail">
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
