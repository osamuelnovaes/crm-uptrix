import { useState, useEffect } from 'react';
import { X, Trash2, Clock, Phone, PhoneOff, UserPlus } from 'lucide-react';
import { STAGES, getStage } from '../utils/stages';

function getDisplayName(lead) {
    if (lead.nome) return lead.nome;
    if (lead.telefone) return lead.telefone;
    if (lead.email) return lead.email;
    return `Lead #${lead.id}`;
}

export default function LeadModal({ lead, vendedores, onClose, onUpdate, onDelete, onAddVendedor }) {
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
            });
        }
    }, [lead]);

    if (!lead) return null;

    const stage = getStage(form.stage);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onUpdate(lead.id, {
            ...form,
            valorProposta: parseFloat(form.valorProposta) || 0,
        });
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja excluir este lead?')) {
            onDelete(lead.id);
            onClose();
        }
    };

    const handleAddVendedor = () => {
        const trimmed = newVendedor.trim();
        if (trimmed) {
            onAddVendedor(trimmed);
            setForm(prev => ({ ...prev, vendedor: trimmed }));
            setNewVendedor('');
        }
    };

    const formatDate = (iso) => {
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderBottom: `2px solid ${stage.color}` }}>
                    <h2>{lead.id ? getDisplayName(lead) : 'Novo Lead'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
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
                            <input
                                type="text"
                                value={form.telefone}
                                onChange={e => handleChange('telefone', e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
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
                    <button className="btn-danger" onClick={handleDelete}>
                        <Trash2 size={16} /> Excluir
                    </button>
                    <div className="modal-footer-right">
                        <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
