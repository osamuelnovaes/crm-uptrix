import { useState, useCallback } from 'react';
import * as storage from '../utils/storage';

export function useLeads() {
    const [leads, setLeads] = useState(() => storage.getLeads());
    const [vendedores, setVendedores] = useState(() => storage.getVendedores());

    const refresh = useCallback(() => {
        setLeads(storage.getLeads());
    }, []);

    const refreshVendedores = useCallback(() => {
        setVendedores(storage.getVendedores());
    }, []);

    const addLead = useCallback((leadData) => {
        const newLead = storage.addLead(leadData);
        refresh();
        return newLead;
    }, [refresh]);

    const addLeadsBatch = useCallback((leadsData) => {
        const newLeads = storage.addLeadsBatch(leadsData);
        refresh();
        return newLeads;
    }, [refresh]);

    const updateLead = useCallback((id, updates) => {
        const updated = storage.updateLead(id, updates);
        refresh();
        return updated;
    }, [refresh]);

    const deleteLead = useCallback((id) => {
        storage.deleteLead(id);
        refresh();
    }, [refresh]);

    const moveLeadToStage = useCallback((id, newStage) => {
        const updated = storage.updateLead(id, { stage: newStage });
        refresh();
        return updated;
    }, [refresh]);

    const addVendedor = useCallback((nome) => {
        storage.addVendedor(nome);
        refreshVendedores();
    }, [refreshVendedores]);

    const removeVendedor = useCallback((nome) => {
        storage.removeVendedor(nome);
        refreshVendedores();
    }, [refreshVendedores]);

    return {
        leads, addLead, addLeadsBatch, updateLead, deleteLead, moveLeadToStage, refresh,
        vendedores, addVendedor, removeVendedor,
    };
}
