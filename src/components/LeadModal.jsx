import { useState, useEffect } from 'react';
import { X, Trash2, Clock, Phone, PhoneOff, UserPlus, MessageCircle } from 'lucide-react';
import { STAGES, getStage } from '../utils/stages';
import { WA_STATUS, WA_STATUS_LABELS, WA_STATUS_COLORS } from '../utils/whatsapp';

function getDisplayName(lead) {
    if (lead.nome) return lead.nome;
    if (lead.telefone) return lead.telefone;
    if (lead.email) return lead.email;
    return `Lead #${lead.id}`;
}

export default function LeadModal({ lead, vendedores, onClose, onUpdate, onDelete, onAddVendedor, onOpenWhatsApp }) {
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        email: '',
        empresa: '',
        notas: '',
        vendedor: '',
        stage: 'novo',
        valorProposta: 0,
        atendeuLigacao: false,
        whatsappStatus: 'nao_enviado',
    });
    const [newVendedor, setNewVendedor] = useState('');

    useEffect(() => {
        if (lead) {
            setForm({
                nome: lead.nome || '',
                telefone: lead.telefone || '',
                email: lead.email || '',
                empresa: lead.empresa || '',
                notas: lead.notas || '',
                vendedor: lead.vendedor || '',
                stage: lead.stage || 'novo',
                valorProposta: lead.valorProposta || 0,
                atendeuLigacao: lead.atendeuLigacao || false,
                whatsappStatus: lead.whatsappStatus || 'nao_enviado',
            });
        }
    }, [lead]);

    if (!lead) return null;

    const stage = getStage(form.stage);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validation: Check duplicate phone if it's a new lead or phone changed
        if (!lead.id && form.telefone) {
            const { checkLeadExists } = await import('../utils/storage');
            const existing = await checkLeadExists(form.telefone);
            if (existing) {
                alert(`Este número já está cadastrado para o vendedor: ${existing.vendedor || 'Sem vendedor'}.`);
                return;
            }
        }

        onUpdate(lead.id, {
            ...form,
            valorProposta: parseFloat(form.valorProposta) || 0,
        });
        onClose();
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        if (isDeleting) {
            onDelete(lead.id);
            onClose();
        } else {
            setIsDeleting(true);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleting(false);
    };

    const handleAddVendedor = () => {
        const trimmed = newVendedor.trim();
        if (trimmed) {
            onAddVendedor(trimmed);
            setForm(prev => ({ ...prev, vendedor: trimmed }));
            setNewVendedor('');
        }
    };

    const handleWhatsAppClick = () => {
        if (form.telefone) {
            if (onOpenWhatsApp) {
                onOpenWhatsApp(form.telefone);
            }
            // Auto-mark as enviado if currently nao_enviado
            if (form.whatsappStatus === WA_STATUS.NAO_ENVIADO) {
                handleChange('whatsappStatus', WA_STATUS.ENVIADO);
            }
        }
    };

    const formatDate = (iso) => {
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const waColor = WA_STATUS_COLORS[form.whatsappStatus] || '#ef4444';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderBottom: `2px solid ${stage.color}` }}>
                    <h2>{lead.id ? getDisplayName(lead) : 'Novo Lead'}</h2>
                    <div className="modal-header-actions">
                        {form.telefone && (
                            <button
                                className="btn-whatsapp"
                                onClick={handleWhatsAppClick}
                                title="Abrir WhatsApp"
                            >
                                <MessageCircle size={16} />
                                WhatsApp
                            </button>
                        )}
                        <button className="modal-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    {/* ... form content ... */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nome</label>
                            <input
                                type="text"
                                value={form.nome}
                                onChange={e => handleChange('nome', e.target.value)}
                                placeholder="Nome do contato"
                            />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <div className="phone-input-group">
                                <input
                                    type="text"
                                    value={form.telefone}
                                    onChange={e => handleChange('telefone', e.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                                {form.telefone && (
                                    <button
                                        type="button"
                                        className="btn-whatsapp-inline"
                                        onClick={handleWhatsAppClick}
                                        title="Abrir WhatsApp"
                                    >
                                        <MessageCircle size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => handleChange('email', e.target.value)}
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Empresa</label>
                            <input
                                type="text"
                                value={form.empresa}
                                onChange={e => handleChange('empresa', e.target.value)}
                                placeholder="Nome da empresa"
                            />
                        </div>
                    </div>

                    {/* WhatsApp Status */}
                    <div className="form-group">
                        <label>
                            <MessageCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                            Status WhatsApp
                        </label>
                        <div className="wa-status-selector">
                            {Object.entries(WA_STATUS).map(([key, value]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`wa-status-btn ${form.whatsappStatus === value ? 'active' : ''}`}
                                    style={{
                                        borderColor: form.whatsappStatus === value ? WA_STATUS_COLORS[value] : 'transparent',
                                        backgroundColor: form.whatsappStatus === value ? WA_STATUS_COLORS[value] + '20' : 'transparent',
                                        color: form.whatsappStatus === value ? WA_STATUS_COLORS[value] : '#94a3b8',
                                    }}
                                    onClick={() => handleChange('whatsappStatus', value)}
                                >
                                    <span className="wa-status-dot-btn" style={{ backgroundColor: WA_STATUS_COLORS[value] }} />
                                    {WA_STATUS_LABELS[value]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Vendedor Responsável</label>
                        <div className="vendedor-input-group">
                            <select
                                value={form.vendedor}
                                onChange={e => handleChange('vendedor', e.target.value)}
                                className="vendedor-modal-select"
                            >
                                <option value="">— Sem vendedor —</option>
                                {vendedores.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <div className="vendedor-add-row">
                                <input
                                    type="text"
                                    value={newVendedor}
                                    onChange={e => setNewVendedor(e.target.value)}
                                    placeholder="Adicionar novo vendedor..."
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddVendedor(); } }}
                                />
                                <button type="button" className="btn-add-vendedor" onClick={handleAddVendedor} title="Adicionar vendedor">
                                    <UserPlus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Estágio</label>
                        <select
                            value={form.stage}
                            onChange={e => handleChange('stage', e.target.value)}
                            style={{ borderColor: stage.color }}
                        >
                            {STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {(form.stage === 'ligacao') && (
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={form.atendeuLigacao}
                                    onChange={e => handleChange('atendeuLigacao', e.target.checked)}
                                />
                                <span className="checkbox-icon">
                                    {form.atendeuLigacao ? <Phone size={16} /> : <PhoneOff size={16} />}
                                </span>
                                {form.atendeuLigacao ? 'Atendeu a ligação' : 'Não atendeu a ligação'}
                            </label>
                        </div>
                    )}

                    {(form.stage === 'proposta' || form.stage === 'fechado') && (
                        <div className="form-group">
                            <label>Valor da Proposta (R$)</label>
                            <input
                                type="number"
                                value={form.valorProposta}
                                onChange={e => handleChange('valorProposta', e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Notas</label>
                        <textarea
                            value={form.notas}
                            onChange={e => handleChange('notas', e.target.value)}
                            placeholder="Observações sobre o lead..."
                            rows={3}
                        />
                    </div>

                    {lead.historico && lead.historico.length > 0 && (
                        <div className="lead-history">
                            <h4><Clock size={14} /> Histórico</h4>
                            <div className="history-list">
                                {[...lead.historico].reverse().map((item, i) => (
                                    <div key={i} className="history-item">
                                        <span className="history-date">{formatDate(item.data)}</span>
                                        <span className="history-action">{item.acao}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {isDeleting ? (
                        <div className="delete-confirm-group" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn-danger confirm"
                                onClick={handleDeleteClick}
                                style={{ background: '#dc2626', color: 'white' }}
                            >
                                <Trash2 size={16} /> Confirmar Exclusão
                            </button>
                            <button className="btn-secondary" onClick={handleCancelDelete}>
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button className="btn-danger" onClick={handleDeleteClick}>
                            <Trash2 size={16} /> Excluir
                        </button>
                    )}

                    {!isDeleting && (
                        <div className="modal-footer-right">
                            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSave}>Salvar</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

