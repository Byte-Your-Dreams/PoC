// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.1/http/server.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Ollama from "npm:ollama-js-client";

const response = await new Ollama({
  model: "llama3.1",
  url: "http://ollama:11434/api/",
}).chat_request([
  { role: "user", content: "Hello my ai friend" },
  { role: "assistant", content: "Hello, I am your llama AI friend." },
  { role: "user", content: "That's funny" },
]);
console.log(response);
serve(async (req: Request) => {
  
  const params = new URL(req.url).searchParams
  const prompt = params.get('prompt') ?? ''

 // Configura l'URL del server Ollama
 const inputText = "Ollama is an AI company that ";
 const response = await llm.invoke({
    model: 'llama3.1',
    messages: [{ role: 'user', content: 'Why is the sky blue?' }],
  })
if (!response) {
  return new Response("Error connecting to Ollama server", { status: 500 });
}
 // Invia la richiesta al server Ollama
 
 // Return the stream to the user
 return new Response(
  JSON.stringify({message: 'hello'}),
  { headers: { "Content-Type": "application/json" } },
)
})
// To invoke:
// curl --get "http://localhost:8000/functions/v1/hello" --data-urlencode "prompt=write a short rap song about Supabase, the Postgres Developer platform, as sung by Nicki Minaj" -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzM0NDc2NDAwLAogICJleHAiOiAxODkyMjQyODAwCn0.sAKa6ugHybSJQzPFpNyeglJdRBxHQ8l-A7Sj6fXH5X8"
