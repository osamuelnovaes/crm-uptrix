import { Droppable, Draggable } from '@hello-pangea/dnd';
import LeadCard from './LeadCard';
import * as Icons from 'lucide-react';

export default function PipelineColumn({ stage, leads, onLeadClick, onDeleteLead }) {
    const IconComponent = Icons[stage.icon] || Icons.Circle;

    return (
        <div className="pipeline-column">
            <div className="pipeline-column-header" style={{ borderBottom: `2px solid ${stage.color}` }}>
                <div className="column-header-left">
                    <IconComponent size={16} style={{ color: stage.color }} />
                    <h3 className="column-title">{stage.label}</h3>
                </div>
                <span className="column-count" style={{ background: stage.bgColor, color: stage.color }}>
                    {leads.length}
                </span>
            </div>

            <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                    <div
                        className={`pipeline-column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                            background: snapshot.isDraggingOver ? stage.bgColor : 'transparent',
                        }}
                    >
                        {leads.map((lead, index) => (
                            <Draggable key={lead.id} draggableId={String(lead.id)} index={index}>
                                {(provided) => (
                                    <LeadCard
                                        lead={lead}
                                        onClick={onLeadClick}
                                        onDelete={onDeleteLead}
                                        provided={provided}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {leads.length === 0 && !snapshot.isDraggingOver && (
                            <div className="column-empty">
                                Arraste leads aqui
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
