import { useState } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Pipeline from './components/Pipeline';
import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
import ImportModal from './components/ImportModal';
import { useLeads } from './hooks/useLeads';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('pipeline');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const {
    leads, addLead, addLeadsBatch, updateLead, deleteLead, moveLeadToStage,
    vendedores, addVendedor,
  } = useLeads();

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handleAddLead = () => {
    const newLead = addLead({});
    setSelectedLead(newLead);
    setShowLeadModal(true);
  };

  const handleImport = (leadsData) => {
    addLeadsBatch(leadsData);
  };

  const handleUpdateLead = (id, updates) => {
    updateLead(id, updates);
    setSelectedLead(null);
  };

  const handleDeleteLead = (id) => {
    deleteLead(id);
    setSelectedLead(null);
    setShowLeadModal(false);
  };

  return (
    <Layout>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onImport={() => setShowImportModal(true)}
        onAddLead={handleAddLead}
      />

      <main className="main-content">
        {currentView === 'pipeline' && (
          <Pipeline
            leads={leads}
            vendedores={vendedores}
            onMoveLeadToStage={moveLeadToStage}
            onLeadClick={handleLeadClick}
            onDeleteLead={handleDeleteLead}
          />
        )}
        {currentView === 'dashboard' && (
          <Dashboard
            leads={leads}
            onLeadClick={handleLeadClick}
          />
        )}
      </main>

      {showLeadModal && selectedLead && (
        <LeadModal
          lead={selectedLead}
          vendedores={vendedores}
          onClose={() => { setShowLeadModal(false); setSelectedLead(null); }}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
          onAddVendedor={addVendedor}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          vendedores={vendedores}
          onAddVendedor={addVendedor}
        />
      )}
    </Layout>
  );
}

export default App;
