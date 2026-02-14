import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jtwrqhodltuswoxwgdja.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0d3JxaG9kbHR1c3dveHdnZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzg1NzgsImV4cCI6MjA4NjYxNDU3OH0.3sYNW5KglbC5uVumoxR2216php8ZoWwHhI4lM3Kpfcs'
);

async function test() {
    // Sign in
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@uptrix.com',
        password: 'Uptrix2024!',
    });
    if (authErr) { console.error('Auth failed:', authErr.message); return; }
    console.log('1. Authenticated OK');

    // Get first lead
    const { data: leads } = await supabase.from('leads').select('id, nome, stage').limit(1);
    if (!leads?.length) { console.log('No leads found'); return; }
    console.log('2. First lead:', JSON.stringify(leads[0]));

    // Test UPDATE
    const { data: updated, error: updateErr } = await supabase
        .from('leads')
        .update({ stage: 'contatado' })
        .eq('id', leads[0].id)
        .select()
        .single();
    console.log('3. UPDATE:', updateErr ? 'FAILED - ' + updateErr.message : 'OK - stage now: ' + updated.stage);

    // Revert
    if (updated) {
        await supabase.from('leads').update({ stage: 'novo' }).eq('id', leads[0].id);
        console.log('   Reverted');
    }

    // Test INSERT + DELETE
    const { data: testLead, error: insertErr } = await supabase
        .from('leads')
        .insert({ nome: 'TMP_DELETE_TEST', stage: 'novo' })
        .select()
        .single();
    console.log('4. INSERT:', insertErr ? 'FAILED - ' + insertErr.message : 'OK - id: ' + testLead.id);

    if (testLead) {
        const { error: delErr } = await supabase
            .from('leads')
            .delete()
            .eq('id', testLead.id);
        console.log('5. DELETE:', delErr ? 'FAILED - ' + delErr.message : 'OK');
    }
}

test().catch(console.error);
