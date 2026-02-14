const STORAGE_KEY = 'uptrix_leads';
const COUNTER_KEY = 'uptrix_lead_counter';
const VENDEDORES_KEY = 'uptrix_vendedores';

export function getLeads() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveLeads(leads) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function getNextId() {
    const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
    localStorage.setItem(COUNTER_KEY, String(counter));
    return counter;
}

export function addLead(lead) {
    const leads = getLeads();
    const id = getNextId();
    const newLead = {
        id,
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        empresa: lead.empresa || '',
        notas: lead.notas || '',
        vendedor: lead.vendedor || '',
        stage: lead.stage || 'novo',
        valorProposta: lead.valorProposta || 0,
        atendeuLigacao: lead.atendeuLigacao || false,
        historico: [
            { data: new Date().toISOString(), acao: 'Lead criado', stage: 'novo' }
        ],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
    };
    leads.push(newLead);
    saveLeads(leads);
    return newLead;
}

export function addLeadsBatch(leadsData) {
    const leads = getLeads();
    const newLeads = leadsData.map(lead => {
        const id = getNextId();
        return {
            id,
            nome: lead.nome || '',
            telefone: lead.telefone || '',
            email: lead.email || '',
            empresa: lead.empresa || '',
            notas: lead.notas || '',
            vendedor: lead.vendedor || '',
            stage: 'novo',
            valorProposta: 0,
            atendeuLigacao: false,
            historico: [
                { data: new Date().toISOString(), acao: 'Lead importado via planilha', stage: 'novo' }
            ],
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
        };
    });
    leads.push(...newLeads);
    saveLeads(leads);
    return newLeads;
}

export function updateLead(id, updates) {
    const leads = getLeads();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) return null;

    const oldLead = leads[index];
    const updatedLead = { ...oldLead, ...updates, atualizadoEm: new Date().toISOString() };

    if (updates.stage && updates.stage !== oldLead.stage) {
        updatedLead.historico = [
            ...oldLead.historico,
            { data: new Date().toISOString(), acao: `Movido para ${updates.stage}`, stage: updates.stage }
        ];
    }

    leads[index] = updatedLead;
    saveLeads(leads);
    return updatedLead;
}

export function deleteLead(id) {
    const leads = getLeads().filter(l => l.id !== id);
    saveLeads(leads);
}

// Vendedores Management
export function getVendedores() {
    try {
        const data = localStorage.getItem(VENDEDORES_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveVendedores(vendedores) {
    localStorage.setItem(VENDEDORES_KEY, JSON.stringify(vendedores));
}

export function addVendedor(nome) {
    const vendedores = getVendedores();
    const trimmed = nome.trim();
    if (!trimmed || vendedores.includes(trimmed)) return vendedores;
    vendedores.push(trimmed);
    saveVendedores(vendedores);
    return vendedores;
}

export function removeVendedor(nome) {
    const vendedores = getVendedores().filter(v => v !== nome);
    saveVendedores(vendedores);
    return vendedores;
}
