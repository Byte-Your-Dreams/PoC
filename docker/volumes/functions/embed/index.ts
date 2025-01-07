// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js';
import { Embedding } from 'jsr:@epi/ollama';

Deno.serve(async (req) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing environment variables SUPABASE_URL or ANON_KEY');
    }

    const authorization = req.headers.get('Authorization');

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: `No authorization header passed` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    try {
        // Extract input string from JSON body
        const { content, manuale, n_chunk } = await req.json();
        // Generate the embedding from the user input
        const embed = await Embedding(content, 'nomic-embed-text', 'http://ollama:11434');

        const { error } = await supabase
          .from('manuale_sezione')
          .update({embedding: embed })
          .match({manuale: manuale, nchunk:n_chunk})
        // Return the embedding
        if (error) {
          throw new Error(`Error inserting embedding: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ 'result':'ok' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error handling request:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
})

// To invoke:
// curl 'http://localhost:<KONG_HTTP_PORT>/functions/v1/hello' \
//   --header 'Authorization: Bearer <anon/service_role API key>'
