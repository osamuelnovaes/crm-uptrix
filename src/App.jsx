import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Pipeline from './components/Pipeline';
import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
import ImportModal from './components/ImportModal';
import LoginPage from './components/LoginPage';
import { useLeads } from './hooks/useLeads';
import { Loader } from 'lucide-react';
import './App.css';

function CRMApp() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('pipeline');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterVendedor, setFilterVendedor] = useState('');

  const {
    leads, loading: dataLoading, addLead, addLeadsBatch, updateLead, deleteLead, moveLeadToStage,
    vendedores, addVendedor,
  } = useLeads();

  const filteredLeads = filterVendedor
    ? leads.filter(l => l.vendedor === filterVendedor)
    : leads;

  // Auth loading
  if (authLoading) {
    return (
      <div className="loading-screen">
        <Loader size={32} className="spin" />
        <p>Carregando...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const handleAddLead = async () => {
    const newLead = await addLead({});
    setSelectedLead(newLead);
    setShowLeadModal(true);
  };

  const handleImport = async (leadsData) => {
    await addLeadsBatch(leadsData);
  };

  const handleUpdateLead = async (id, updates) => {
    await updateLead(id, updates);
    setSelectedLead(null);
  };

  const handleDeleteLead = async (id) => {
    await deleteLead(id);
    setSelectedLead(null);
    setShowLeadModal(false);
  };

  return (
    <Layout user={user} onSignOut={signOut}>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onImport={() => setShowImportModal(true)}
        onAddLead={handleAddLead}
      />

      <main className="main-content">
        {dataLoading ? (
          <div className="loading-screen loading-inline">
            <Loader size={24} className="spin" />
            <p>Carregando leads...</p>
          </div>
        ) : (
          <>
            {currentView === 'pipeline' && (
              <Pipeline
                leads={filteredLeads}
                vendedores={vendedores}
                filterVendedor={filterVendedor}
                onFilterVendedorChange={setFilterVendedor}
                onMoveLeadToStage={moveLeadToStage}
                onLeadClick={handleLeadClick}
                onDeleteLead={handleDeleteLead}
              />
            )}
            {currentView === 'dashboard' && (
              <Dashboard
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
              />
            )}
          </>
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

function App() {
  return (
    <AuthProvider>
      <CRMApp />
    </AuthProvider>
  );
}

export default App;
