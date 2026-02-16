import * as XLSX from 'xlsx';

const COLUMN_MAPPINGS = {
    nome: ['nome', 'name', 'nome completo', 'full name', 'contato', 'contact', 'cliente', 'client', 'saved_name', 'public_name', 'display_name'],
    telefone: ['telefone', 'phone', 'tel', 'celular', 'mobile', 'whatsapp', 'fone', 'número', 'numero', 'phone_number', 'formatted_phone'],
    email: ['email', 'e-mail', 'mail', 'correio'],
    empresa: ['empresa', 'company', 'organização', 'organizacao', 'org', 'firma'],
    vendedor: ['vendedor', 'responsavel', 'sales', 'salesperson', 'consultor', 'atendente'],
};

function normalizeHeader(header) {
    return String(header).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectColumnMapping(headers) {
    const mapping = {};
    const normalizedHeaders = headers.map(normalizeHeader);

    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        const normalizedAliases = aliases.map(a => a.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        const index = normalizedHeaders.findIndex(h => normalizedAliases.some(a => h.includes(a)));
        if (index !== -1) {
            mapping[field] = index;
        }
    }

    return mapping;
}

export function parseSpreadsheet(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                if (jsonData.length < 1) {
                    resolve({ headers: [], rows: [], mapping: {} });
                    return;
                }

                const headers = jsonData[0].map(String);
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));
                const mapping = detectColumnMapping(headers);

                resolve({ headers, rows, mapping });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

export function mapRowsToLeads(rows, mapping, headers = []) {
    return rows.map((row) => {
        const lead = {
            nome: mapping.nome !== undefined ? String(row[mapping.nome] || '') : '',
            telefone: mapping.telefone !== undefined ? String(row[mapping.telefone] || '') : '',
            email: mapping.email !== undefined ? String(row[mapping.email] || '') : '',
            empresa: mapping.empresa !== undefined ? String(row[mapping.empresa] || '') : '',
            vendedor: mapping.vendedor !== undefined ? String(row[mapping.vendedor] || '') : '',
            notas: ''
        };

        // Clean phone number (keep only digits)
        lead.telefone = lead.telefone.replace(/\D/g, '');

        // Fallback: name to phone if empty
        if (!lead.nome && lead.telefone) {
            lead.nome = lead.telefone;
        }

        // Capture all other columns as notes
        const mappedIndices = new Set(Object.values(mapping));
        const extraInfo = [];

        row.forEach((cell, index) => {
            if (!mappedIndices.has(index) && cell !== undefined && cell !== '') {
                const header = headers[index] || `Coluna ${index + 1}`;
                extraInfo.push(`${header}: ${cell}`);
            }
        });

        if (extraInfo.length > 0) {
            lead.notas = extraInfo.join('\n');
        }

        return lead;
    }).filter(lead => lead.telefone || lead.nome);
}
