// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.1/http/server.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const session = new Supabase.ai.Session('mistral')

serve(async (req: Request) => {
  
  const params = new URL(req.url).searchParams
  const prompt = params.get('prompt') ?? ''

 // Configura l'URL del server Ollama
 const output = await session.run(prompt, { stream: true })

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
  })

  // Create a stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const chunk of output) {
          controller.enqueue(encoder.encode(chunk.response ?? ''))
        }
      } catch (err) {
        console.error('Stream error:', err)
      } finally {
        controller.close()
      }
    },
  })

  // Return the stream to the user
  return new Response(stream, {
    headers,
  })
})
// To invoke:
// curl --get "http://localhost:8000/functions/v1/gen_supa" \
//--data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" \
//-H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM0NDc2NDAwLAogICJleHAiOiAxODkyMjQyODAwCn0.sAKa6ugHybSJQzPFpNyeglJdRBxHQ8l-A7Sj6fXH5X8"