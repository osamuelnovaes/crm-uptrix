import { useState, useEffect, useCallback } from 'react';
import * as storage from '../utils/storage';

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
        const lead = leads.find(l => l.id === id);
        if (!lead) return;

        const newHistorico = [
            ...lead.historico,
            { data: new Date().toISOString(), acao: `Movido para ${stage}`, stage }
        ];

        const updated = await storage.updateLead(id, { stage, historico: newHistorico });
        if (updated) {
            setLeads(prev => prev.map(l => l.id === id ? updated : l));
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
