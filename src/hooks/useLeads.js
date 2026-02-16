import { useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';
import * as ws from '../utils/whatsappSocket';

export function useLeads() {
    const [leads, setLeads] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load all data on mount
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [leadsData, vendedoresData] = await Promise.all([
                storage.getLeads(),
                storage.getVendedores(),
            ]);
            setLeads(leadsData);
            setVendedores(vendedoresData);
            setLoading(false);
        }
        loadData();
    }, []);

    // Listen for real-time updates from server (e.g. auto-move)
    useEffect(() => {
        const unsub = ws.on('lead-updated', ({ id, stage }) => {
            setLeads(prev => prev.map(l => {
                if (l.id === id) {
                    return { ...l, stage, atualizadoEm: new Date().toISOString() };
                }
                return l;
            }));
        });
        return () => unsub();
    }, []);

    const refresh = useCallback(async () => {
        const data = await storage.getLeads();
        setLeads(data);
    }, []);

    const refreshVendedores = useCallback(async () => {
        const data = await storage.getVendedores();
        setVendedores(data);
    }, []);

    const addLead = useCallback(async (leadData) => {
        const newLead = await storage.addLead(leadData);
        if (newLead) setLeads(prev => [newLead, ...prev]);
        return newLead;
    }, []);

    const addLeadsBatch = useCallback(async (leadsData) => {
        const newLeads = await storage.addLeadsBatch(leadsData);
        if (newLeads.length) setLeads(prev => [...newLeads, ...prev]);
        return newLeads;
    }, []);

    const updateLead = useCallback(async (id, updates) => {
        const updated = await storage.updateLead(id, updates);
        if (updated) {
            setLeads(prev => prev.map(l => l.id === id ? updated : l));
        }
        return updated;
    }, []);

    const deleteLead = useCallback(async (id) => {
        await storage.deleteLead(id);
        setLeads(prev => prev.filter(l => l.id !== id));
    }, []);

    const moveLeadToStage = useCallback(async (id, stage) => {
        // Find lead by string comparison to handle both number and UUID types safely
        const lead = leads.find(l => String(l.id) === String(id));
        if (!lead) return;

        // Use the real ID type from the found object
        const realId = lead.id;

        // 1. Optimistic Update (Immediate Feedback)
        setLeads(prev => prev.map(l => l.id === realId ? { ...l, stage } : l));

        const newHistorico = [
            ...(lead.historico || []),
            { data: new Date().toISOString(), acao: `Movido para ${stage}`, stage }
        ];

        // 2. Persist to DB
        try {
            const updated = await storage.updateLead(realId, { stage, historico: newHistorico });
            if (updated) {
                // Confirm with server data
                setLeads(prev => prev.map(l => l.id === realId ? updated : l));
            } else {
                // Revert on failure
                setLeads(prev => prev.map(l => l.id === realId ? lead : l));
            }
        } catch (error) {
            console.error('Error moving lead:', error);
            // Revert on error
            setLeads(prev => prev.map(l => l.id === realId ? lead : l));
        }
    }, [leads]);

    const addVendedor = useCallback(async (nome) => {
        await storage.addVendedor(nome);
        await refreshVendedores();
    }, [refreshVendedores]);

    const removeVendedor = useCallback(async (nome) => {
        await storage.removeVendedor(nome);
        await refreshVendedores();
    }, [refreshVendedores]);

    return {
        leads, loading, addLead, addLeadsBatch, updateLead, deleteLead, moveLeadToStage, refresh,
        vendedores, addVendedor, removeVendedor,
    };
}
