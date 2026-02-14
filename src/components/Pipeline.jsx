import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
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
    onDeleteLead
}) {
    const [search, setSearch] = useState('');

    const filteredLeads = leads.filter(lead => {
        // filterVendedor is applied in App.jsx, but we keep search here
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

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        // Don't parse int, as IDs can be UUIDs. We treat all IDs as strings for lookup.
        const leadId = draggableId;
        const newStage = destination.droppableId;
        onMoveLeadToStage(leadId, newStage);
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

            <DragDropContext onDragEnd={handleDragEnd}>
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
                            />
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}
