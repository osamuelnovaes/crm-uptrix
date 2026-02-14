import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, ArrowRight, Check, UserPlus, User } from 'lucide-react';
import { parseSpreadsheet, mapRowsToLeads } from '../utils/importSpreadsheet';

export default function ImportModal({ onClose, onImport, vendedores, onAddVendedor }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [mapping, setMapping] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [vendedor, setVendedor] = useState('');
    const [newVendedor, setNewVendedor] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setError('');

        try {
            const result = await parseSpreadsheet(selectedFile);
            setParseResult(result);
            setMapping(result.mapping);
            setStep(2);
        } catch (err) {
            setError('Erro ao ler o arquivo. Verifique se é um arquivo .xlsx ou .csv válido.');
        } finally {
            setLoading(false);
        }
    };

    const handleMappingChange = (field, colIndex) => {
        setMapping(prev => ({
            ...prev,
            [field]: colIndex === '' ? undefined : parseInt(colIndex, 10),
        }));
    };

    const handleAddVendedor = () => {
        const trimmed = newVendedor.trim();
        if (trimmed) {
            onAddVendedor(trimmed);
            setVendedor(trimmed);
            setNewVendedor('');
        }
    };

    const handleImport = () => {
        if (!parseResult) return;
        const leads = mapRowsToLeads(parseResult.rows, mapping);
        // Atribuir vendedor: usa o do dropdown se selecionado, senão usa o da planilha
        const leadsWithVendedor = leads.map(l => ({
            ...l,
            vendedor: vendedor || l.vendedor || ''
        }));
        onImport(leadsWithVendedor);
        onClose();
    };

    const previewLeads = parseResult ? mapRowsToLeads(parseResult.rows.slice(0, 5), mapping) : [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><FileSpreadsheet size={20} /> Importar Planilha</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {step === 1 && (
                        <div className="import-step-1">
                            <div
                                className="upload-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={48} />
                                <p className="upload-text">
                                    {loading ? 'Processando...' : 'Clique ou arraste para selecionar o arquivo'}
                                </p>
                                <p className="upload-hint">.xlsx ou .csv</p>
                                {file && <p className="upload-file">{file.name}</p>}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            {error && <p className="import-error">{error}</p>}
                        </div>
                    )}

                    {step === 2 && parseResult && (
                        <div className="import-step-2">
                            <h3>Mapear Colunas</h3>
                            <p className="import-info">
                                {parseResult.rows.length} contatos encontrados. Selecione as colunas correspondentes:
                            </p>

                            <div className="mapping-grid">
                                {['nome', 'telefone', 'email', 'empresa', 'vendedor'].map(field => (
                                    <div key={field} className="mapping-row">
                                        <label className="mapping-label">
                                            {field === 'nome' ? 'Nome' :
                                                field === 'telefone' ? 'Telefone' :
                                                    field === 'email' ? 'Email' :
                                                        field === 'vendedor' ? 'Vendedor' : 'Empresa'}
                                        </label>
                                        <ArrowRight size={16} className="mapping-arrow" />
                                        <select
                                            value={mapping[field] !== undefined ? mapping[field] : ''}
                                            onChange={e => handleMappingChange(field, e.target.value)}
                                            className="mapping-select"
                                        >
                                            <option value="">— Não mapear —</option>
                                            {parseResult.headers.map((header, i) => (
                                                <option key={i} value={i}>{header}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="import-vendedor-section">
                                <h4><User size={14} /> Vendedor Responsável</h4>
                                <p className="import-vendedor-hint">Todos os contatos importados serão atribuídos a este vendedor</p>
                                <div className="vendedor-input-group">
                                    <select
                                        value={vendedor}
                                        onChange={e => setVendedor(e.target.value)}
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

                            {previewLeads.length > 0 && (
                                <div className="import-preview">
                                    <h4>Preview (primeiros 5)</h4>
                                    <div className="preview-table-wrapper">
                                        <table className="preview-table">
                                            <thead>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>Telefone</th>
                                                    <th>Email</th>
                                                    <th>Empresa</th>
                                                    <th>Vendedor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewLeads.map((lead, i) => (
                                                    <tr key={i}>
                                                        <td>{lead.nome || <span className="empty-cell">—</span>}</td>
                                                        <td>{lead.telefone || <span className="empty-cell">—</span>}</td>
                                                        <td>{lead.email || <span className="empty-cell">—</span>}</td>
                                                        <td>{lead.empresa || <span className="empty-cell">—</span>}</td>
                                                        <td>{lead.vendedor || <span className="empty-cell">—</span>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step === 2 && (
                        <>
                            <button className="btn-secondary" onClick={() => setStep(1)}>Voltar</button>
                            <button className="btn-primary" onClick={handleImport}>
                                <Check size={16} /> Importar {parseResult?.rows.length || 0} contatos
                                {vendedor && <span className="import-vendedor-tag">→ {vendedor}</span>}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
