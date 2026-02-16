import { useState } from 'react';
import { STAGES } from '../utils/stages';
import PipelineColumn from './PipelineColumn';
import SearchBar from './SearchBar';
import { User } from 'lucide-react';

export default function Pipeline({
    leads,
    vendedores,
    filterVendedor,
    onFilterVendedorChange,
    onMoveLeadToStage,
    onLeadClick,
    onDeleteLead,
    onOpenWhatsApp
}) {
    const [search, setSearch] = useState('');
    const [draggingLeadId, setDraggingLeadId] = useState(null);

    const filteredLeads = leads.filter(lead => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            (lead.nome || '').toLowerCase().includes(s) ||
            (lead.telefone || '').toLowerCase().includes(s) ||
            (lead.empresa || '').toLowerCase().includes(s) ||
            (lead.email || '').toLowerCase().includes(s) ||
            (lead.vendedor || '').toLowerCase().includes(s)
        );
    });

    const handleDragStart = (leadId) => {
        setDraggingLeadId(leadId);
    };

    const handleDragEnd = () => {
        setDraggingLeadId(null);
    };

    const handleDropOnStage = (stageId) => {
        if (draggingLeadId) {
            onMoveLeadToStage(draggingLeadId, stageId);
            setDraggingLeadId(null);
        }
    };

    return (
        <div className="pipeline-view">
            <div className="pipeline-header">
                <h2 className="pipeline-title">Pipeline de Leads</h2>
                <div className="pipeline-filters">
                    {vendedores.length > 0 && (
                        <div className="vendedor-filter">
                            <User size={16} />
                            <select
                                value={filterVendedor}
                                onChange={e => onFilterVendedorChange(e.target.value)}
                                className="vendedor-select"
                            >
                                <option value="">Todos os vendedores</option>
                                {vendedores.map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <SearchBar value={search} onChange={setSearch} />
                </div>
            </div>

            <div className="pipeline-board">
                {STAGES.map(stage => {
                    const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
                    return (
                        <PipelineColumn
                            key={stage.id}
                            stage={stage}
                            leads={stageLeads}
                            onLeadClick={onLeadClick}
                            onDeleteLead={onDeleteLead}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDropOnStage}
                            isDragging={!!draggingLeadId}
                            onOpenWhatsApp={onOpenWhatsApp}
                        />
                    );
                })}
            </div>
        </div>
    );
}
