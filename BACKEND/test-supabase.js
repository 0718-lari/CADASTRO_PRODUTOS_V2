require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

async function testar() {
    const { data, error } = await supabase
        .from('produtos')
        .select('*');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Conexão com Supabase OK!');
    console.log(data);
}

testar();