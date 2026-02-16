import { useState } from 'react';
import LeadCard from './LeadCard';
import * as Icons from 'lucide-react';

export default function PipelineColumn({
    stage,
    leads,
    onLeadClick,
    onDeleteLead,
    onDragStart,
    onDragEnd,
    onDrop,
    isDragging,
    onOpenWhatsApp
}) {
    const IconComponent = Icons[stage.icon] || Icons.Circle;
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        if (isDragging) {
            e.preventDefault();
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(stage.id);
    };

    return (
        <div
            className="pipeline-column"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                borderColor: isDragOver ? stage.color : 'var(--border-light)',
                boxShadow: isDragOver ? `0 0 0 2px ${stage.color}40` : 'none',
                transition: 'all 0.2s ease'
            }}
        >
            <div className="pipeline-column-header" style={{ borderBottom: `2px solid ${stage.color}` }}>
                <div className="column-header-left">
                    <IconComponent size={16} style={{ color: stage.color }} />
                    <h3 className="column-title">{stage.label}</h3>
                </div>
                <span className="column-count" style={{ background: stage.bgColor, color: stage.color }}>
                    {leads.length}
                </span>
            </div>

            <div
                className={`pipeline-column-body ${isDragOver ? 'drag-over' : ''}`}
                style={{
                    background: isDragOver ? stage.bgColor : 'transparent',
                }}
            >
                {leads.map((lead, index) => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={onLeadClick}
                        onDelete={onDeleteLead}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onOpenWhatsApp={onOpenWhatsApp}
                    />
                ))}
                {leads.length === 0 && !isDragOver && (
                    <div className="column-empty">
                        Arraste leads aqui
                    </div>
                )}
            </div>
        </div>
    );
}
