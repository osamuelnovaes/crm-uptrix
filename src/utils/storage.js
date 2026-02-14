import { supabase } from '../lib/supabaseClient';

// ─── Leads ───────────────────────────────────────────────

export async function getLeads() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) { console.error('getLeads error:', error); return []; }

    // Map snake_case columns to camelCase for frontend compatibility
    return data.map(mapLeadFromDB);
}

export async function addLead(lead) {
    const row = {
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        empresa: lead.empresa || '',
        notas: lead.notas || '',
        vendedor: lead.vendedor || '',
        stage: lead.stage || 'novo',
        valor_proposta: lead.valorProposta || 0,
        atendeu_ligacao: lead.atendeuLigacao || false,
        historico: [
            { data: new Date().toISOString(), acao: 'Lead criado', stage: 'novo' }
        ],
    };

    const { data, error } = await supabase
        .from('leads')
        .insert(row)
        .select()
        .single();

    if (error) { console.error('addLead error:', error); return null; }
    return mapLeadFromDB(data);
}

export async function checkLeadsExistBatch(phones) {
    if (!phones || phones.length === 0) return [];

    // Clean phones to match DB storage (assuming raw for now based on previous simple check)
    // If DB has mixed formats, this is hard. Assuming exact match for now.

    // Split into chunks if too many? Supabase can handle reasonable number.
    // Let's do a simple IN query.

    const { data, error } = await supabase
        .from('leads')
        .select('telefone, vendedor')
        .in('telefone', phones);

    if (error) { console.error('checkLeadsExistBatch error:', error); return []; }
    return data; // returns array of {telefone, vendedor}
}

export async function addLeadsBatch(leadsData) {
    const rows = leadsData.map(lead => ({
        nome: lead.nome || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        empresa: lead.empresa || '',
        notas: lead.notas || '',
        vendedor: lead.vendedor || '',
        stage: 'novo',
        valor_proposta: 0,
        atendeu_ligacao: false,
        historico: [
            { data: new Date().toISOString(), acao: 'Lead importado via planilha', stage: 'novo' }
        ],
    }));

    const { data, error } = await supabase
        .from('leads')
        .insert(rows)
        .select();

    if (error) { console.error('addLeadsBatch error:', error); return []; }
    return data.map(mapLeadFromDB);
}

export async function updateLead(id, updates) {
    // Build update object with snake_case
    const row = { atualizado_em: new Date().toISOString() };
    if (updates.nome !== undefined) row.nome = updates.nome;
    if (updates.telefone !== undefined) row.telefone = updates.telefone;
    if (updates.email !== undefined) row.email = updates.email;
    if (updates.empresa !== undefined) row.empresa = updates.empresa;
    if (updates.notas !== undefined) row.notas = updates.notas;
    if (updates.vendedor !== undefined) row.vendedor = updates.vendedor;
    if (updates.stage !== undefined) row.stage = updates.stage;
    if (updates.valorProposta !== undefined) row.valor_proposta = updates.valorProposta;
    if (updates.atendeuLigacao !== undefined) row.atendeu_ligacao = updates.atendeuLigacao;
    if (updates.historico !== undefined) row.historico = updates.historico;

    const { data, error } = await supabase
        .from('leads')
        .update(row)
        .eq('id', id)
        .select()
        .single();

    if (error) { console.error('updateLead error:', error); return null; }
    return mapLeadFromDB(data);
}

export async function deleteLead(id) {
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) console.error('deleteLead error:', error);
}

// ─── Vendedores ──────────────────────────────────────────

export async function getVendedores() {
    const { data, error } = await supabase
        .from('vendedores')
        .select('nome')
        .order('nome');

    if (error) { console.error('getVendedores error:', error); return []; }
    return data.map(v => v.nome);
}

export async function addVendedor(nome) {
    const trimmed = nome.trim();
    if (!trimmed) return;

    const { error } = await supabase
        .from('vendedores')
        .upsert({ nome: trimmed }, { onConflict: 'nome' });

    if (error) console.error('addVendedor error:', error);
}

export async function removeVendedor(nome) {
    const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('nome', nome);

    if (error) console.error('removeVendedor error:', error);
}

// ─── Helpers ─────────────────────────────────────────────

function mapLeadFromDB(row) {
    return {
        id: row.id,
        nome: row.nome,
        telefone: row.telefone,
        email: row.email,
        empresa: row.empresa,
        notas: row.notas,
        vendedor: row.vendedor,
        stage: row.stage,
        valorProposta: Number(row.valor_proposta) || 0,
        atendeuLigacao: row.atendeu_ligacao || false,
        historico: row.historico || [],
        criadoEm: row.criado_em,
        atualizadoEm: row.atualizado_em,
    };
}
