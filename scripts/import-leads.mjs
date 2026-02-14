import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://jtwrqhodltuswoxwgdja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0d3JxaG9kbHR1c3dveHdnZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzg1NzgsImV4cCI6MjA4NjYxNDU3OH0.3sYNW5KglbC5uVumoxR2216php8ZoWwHhI4lM3Kpfcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SPREADSHEET_PATH = '/Users/samuelnovaes/Downloads/WA-EXTRACTOR-Trabalhos de última hora🇧🇷_1771025509044.xlsx';
const VENDEDOR = 'gabriel';

async function signIn() {
    console.log('Signing in as admin@uptrix.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@uptrix.com',
        password: 'Uptrix2024!',
    });
    if (error) {
        console.error('Auth failed:', error.message);
        process.exit(1);
    }
    console.log('Signed in successfully as:', data.user.email);
    return data;
}

async function deleteAllLeads() {
    console.log('\nStep 1: Deleting all existing leads...');

    // First, count how many leads exist
    const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id');

    if (fetchError) {
        console.error('Cannot fetch leads:', fetchError);
        return false;
    }

    console.log(`Found ${allLeads.length} leads to delete.`);

    if (allLeads.length === 0) {
        console.log('No leads to delete.');
        return true;
    }

    // Delete in batches of 100
    for (let i = 0; i < allLeads.length; i += 100) {
        const batch = allLeads.slice(i, i + 100).map(l => l.id);
        const { error: batchError } = await supabase
            .from('leads')
            .delete()
            .in('id', batch);

        if (batchError) {
            console.error(`Batch delete error at ${i}:`, batchError);
            return false;
        }
        console.log(`  Deleted batch ${Math.floor(i / 100) + 1}/${Math.ceil(allLeads.length / 100)}`);
    }

    // Verify
    const { data: remaining } = await supabase.from('leads').select('id');
    console.log(`Remaining leads after delete: ${remaining?.length || 0}`);
    return true;
}

function readSpreadsheet() {
    console.log(`\nStep 2: Reading spreadsheet...`);
    const fileBuffer = readFileSync(SPREADSHEET_PATH);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (jsonData.length < 1) {
        console.log('Spreadsheet is empty.');
        return [];
    }

    const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
    console.log('Headers:', headers);
    const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''));

    // Detect columns
    const COLUMN_MAPPINGS = {
        nome: ['nome', 'name', 'saved_name', 'public_name', 'contato', 'contact'],
        telefone: ['telefone', 'phone', 'phone_number', 'formatted_phone', 'tel', 'celular', 'whatsapp'],
        email: ['email', 'e-mail'],
        empresa: ['empresa', 'company'],
    };

    const mapping = {};
    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const index = headers.findIndex(h => aliases.some(a => norm(h).includes(norm(a))));
        if (index !== -1) mapping[field] = index;
    }

    console.log('Column mapping:', mapping);
    console.log('Sample row:', rows[0]);

    // For WA-EXTRACTOR, use "saved_name" or "public_name" for nome
    // and "phone_number" or "formatted_phone" for telefone
    // Let's be smarter: prefer saved_name for nome, fall back to public_name
    const savedNameIdx = headers.findIndex(h => h === 'saved_name');
    const publicNameIdx = headers.findIndex(h => h === 'public_name');
    const phoneIdx = headers.findIndex(h => h === 'phone_number');
    const formattedPhoneIdx = headers.findIndex(h => h === 'formatted_phone');

    const leads = rows.map(row => {
        // Get the best name available
        let nome = '';
        if (savedNameIdx !== -1 && row[savedNameIdx]) {
            nome = String(row[savedNameIdx]);
        } else if (publicNameIdx !== -1 && row[publicNameIdx]) {
            nome = String(row[publicNameIdx]);
        }

        // Get the best phone
        let telefone = '';
        if (formattedPhoneIdx !== -1 && row[formattedPhoneIdx]) {
            telefone = String(row[formattedPhoneIdx]);
        } else if (phoneIdx !== -1 && row[phoneIdx]) {
            telefone = String(row[phoneIdx]);
        }

        return {
            nome,
            telefone,
            email: '',
            empresa: '',
            notas: '',
            vendedor: VENDEDOR,
            stage: 'novo',
            valor_proposta: 0,
            atendeu_ligacao: false,
            historico: [
                { data: new Date().toISOString(), acao: 'Lead importado via planilha', stage: 'novo' }
            ],
        };
    }).filter(l => l.telefone || l.nome);

    console.log(`Parsed ${leads.length} leads from spreadsheet.`);
    if (leads.length > 0) {
        console.log('First lead sample:', { nome: leads[0].nome, telefone: leads[0].telefone });
    }
    return leads;
}

async function importLeads(leads) {
    console.log(`\nStep 3: Importing ${leads.length} leads in batches...`);

    const BATCH_SIZE = 50;
    let imported = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
            .from('leads')
            .insert(batch)
            .select();

        if (error) {
            console.error(`Import error at batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
            return imported;
        }
        imported += (data ? data.length : batch.length);
        process.stdout.write(`  Imported ${imported}/${leads.length} leads...\r`);
    }

    console.log(`\nDone! ${imported} leads imported with vendedor "${VENDEDOR}".`);
    return imported;
}

async function ensureVendedor() {
    const { error } = await supabase
        .from('vendedores')
        .upsert({ nome: VENDEDOR }, { onConflict: 'nome' });

    if (error) {
        console.error('Error adding vendedor:', error);
    } else {
        console.log(`Vendedor "${VENDEDOR}" ensured in database.`);
    }
}

async function main() {
    console.log('=== CRM Uptrix - Import Leads Script ===\n');

    // Step 0: Authenticate
    await signIn();

    // Step 1: Delete all leads
    const deleted = await deleteAllLeads();
    if (!deleted) {
        console.error('Failed to delete leads. Aborting.');
        process.exit(1);
    }

    // Step 2: Read spreadsheet
    const leads = readSpreadsheet();
    if (leads.length === 0) {
        console.log('No leads to import.');
        process.exit(0);
    }

    // Step 3: Ensure vendedor exists
    await ensureVendedor();

    // Step 4: Import leads
    const count = await importLeads(leads);

    // Verify final count
    const { data: finalCount } = await supabase.from('leads').select('id');
    console.log(`\nVerification: ${finalCount?.length || 0} leads now in database.`);

    console.log('\n=== Import complete! ===');
}

main().catch(console.error);
