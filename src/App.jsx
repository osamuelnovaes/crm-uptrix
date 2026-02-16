import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import Pipeline from './components/Pipeline';
import Dashboard from './components/Dashboard';
import LeadModal from './components/LeadModal';
import ImportModal from './components/ImportModal';
import LoginPage from './components/LoginPage';
import WhatsAppPanel from './components/WhatsAppPanel';
import { useLeads } from './hooks/useLeads';
import * as ws from './utils/whatsappSocket';
import { Loader } from 'lucide-react';
import './App.css';

function CRMApp() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('pipeline');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterVendedor, setFilterVendedor] = useState('');

  // WhatsApp panel state
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(null);

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

  // WhatsApp: abrir painel com telefone específico
  const handleOpenWhatsApp = (phone) => {
    setWhatsAppPhone(phone || null);
    setShowWhatsAppPanel(true);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (view === 'whatsapp') {
      setShowWhatsAppPanel(false);
      setWhatsAppPhone(null);
    }
  };

  return (
    <Layout user={user} onSignOut={signOut}>
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onImport={() => setShowImportModal(true)}
        onAddLead={handleAddLead}
      />

      <main className={`main-content ${showWhatsAppPanel ? 'with-whatsapp-panel' : ''}`}>
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
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}
            {currentView === 'dashboard' && (
              <Dashboard
                leads={filteredLeads}
                onLeadClick={handleLeadClick}
              />
            )}
            {currentView === 'whatsapp' && (
              <WhatsAppPanel
                mode="full"
                leads={leads}
                onClose={() => setCurrentView('pipeline')}
                onSelectLead={handleLeadClick}
              />
            )}
          </>
        )}
      </main>

      {/* WhatsApp Panel */}
      {showWhatsAppPanel && (
        <WhatsAppPanel
          phone={whatsAppPhone}
          leads={leads}
          onClose={() => { setShowWhatsAppPanel(false); setWhatsAppPhone(null); if (currentView === 'whatsapp') setCurrentView('pipeline'); }}
          onSelectLead={handleLeadClick}
        />
      )}

      {showLeadModal && selectedLead && (
        <LeadModal
          lead={selectedLead}
          vendedores={vendedores}
          onClose={() => { setShowLeadModal(false); setSelectedLead(null); }}
          onUpdate={handleUpdateLead}
          onDelete={handleDeleteLead}
          onAddVendedor={addVendedor}
          onOpenWhatsApp={handleOpenWhatsApp}
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
