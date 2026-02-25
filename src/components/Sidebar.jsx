import { LayoutDashboard, Kanban, Upload, Plus } from 'lucide-react';

export default function Sidebar({ currentView, onViewChange, onImport, onAddLead }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Kanban size={24} />
                </div>
                <h1 className="logo-text">Uptrix</h1>
                <span className="logo-tag">CRM</span>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={`nav-item ${currentView === 'pipeline' ? 'active' : ''}`}
                    onClick={() => onViewChange('pipeline')}
                >
                    <Kanban size={20} />
                    <span>Pipeline</span>
                </button>
                <button
                    className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onViewChange('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </button>
            </nav>

            <div className="sidebar-actions">
                <button className="action-btn primary" onClick={onAddLead}>
                    <Plus size={18} />
                    <span>Novo Lead</span>
                </button>
                <button className="action-btn secondary" onClick={onImport}>
                    <Upload size={18} />
                    <span>Importar Planilha</span>
                </button>
            </div>
        </aside>
    );
}
