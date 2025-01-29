// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js';
import { ChatPromptTemplate } from "npm:@langchain/core/prompts";
import { SystemMessage, HumanMessage, AIMessage } from "npm:@langchain/core/messages"
import { OpenAI } from "npm:openai";

function extractProductName(query: string, productNames: string[]): string | null {
  const relevantProd: { name: string, percentage: number }[] = [];
  try {
    for (const productName of productNames) {
        const splittedProduct = productName.split(' ');
        let sum = 0;
        let den = 0;

        for (let i = 0; i < splittedProduct.length; i++) {
            const elem = splittedProduct[i];
            den += splittedProduct.length - i;
            if (query.toLowerCase().includes(elem.toLowerCase()) && elem.length >= 4) {
                sum += splittedProduct.length - i;
            } else if (elem.length < 4) {
                den -= splittedProduct.length - i;
            }
        }

        const percentage = (sum / den) * 100;
        relevantProd.push({ name: productName, percentage });
    }

    const maxPercentage = relevantProd.reduce((max, prod) => prod.percentage > max.percentage ? prod : max, relevantProd[0]);

    if (maxPercentage.percentage <= 0.5) {
        return null;
    }

    return maxPercentage.name;
  }
  catch (e) {
    console.error(e);
    return null;
  }
}

// DA RIFARE!!!!!!!!!!
async function reformulateQuestion(question: string, supabase: any, llmIstance: any, chat_id: string) {
  let messages =  ([ new SystemMessage("Data una cronologia della chat e l'ultima domanda dell'utente \
    che potrebbe fare riferimento al contesto nella cronologia della chat, formula una domanda indipendente \
    che possa essere compresa senza la cronologia della chat. NON rispondere alla domanda, \
    semplicemente riformulala se necessario e altrimenti restituirla così com'è.") ]);
  let chatHistory = await supabase.rpc('getlastmessages', { chat_id });
  let lastMsg = "";
  if (chatHistory.data) {
    (chatHistory.data).forEach((msg: { domanda, risposta }) => {
      if (msg.risposta) {
        messages.push(new HumanMessage(msg.domanda));
        messages.push(new AIMessage(msg.risposta));
      } else {
        lastMsg = msg.domanda;
      }
    });
    messages.push(new HumanMessage("{input}"));
    let prompt =  ChatPromptTemplate.fromMessages(messages);
    const chain = prompt.pipe(llmIstance);
    const result = await chain.invoke();
    
    // Stampa la riformulazione della domanda
    console.log(result);
    return result.content;
  }
  return;
}

function removeThinkTag(text) {
  // Regex per trovare il tag <think> e tutto il suo contenuto
  return text.replace(/<think>[\s\S]*?<\/think>/g, '');
}

Deno.serve(async (req) => {
    try {
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
      //supabase client
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      //input
      let { question, id, chat_id } = await req.json();
      console.log("question", question);
      console.log("id", id);
      console.log("chat_id", chat_id);
      let fullResponse = "";

      // ollama
      const llmIstance = new OpenAI({
        baseURL : 'http://ollama:11434/v1',
        apiKey: 'ollama' 
      });
        // "deepseek-v2:16b",
        // temperature: 0,
        // streaming: true,
        // callbackManager: CallbackManager.fromHandlers({
        //   handleLLMNewToken: async (token) => {
        //     fullResponse += token;
        //     console.log(fullResponse);
        //     console.log("-------------------");
        //   },
        //   handleLLMEnd: async () => {        
        //     console.log("end");
        //   }
        // }),

      // rag      

      let product_names = await supabase.from('prodotto').select('nome');
      let pdfs, chunk;
      //ottengo dalla query il nome del prodotto
      let productName = extractProductName(question, product_names.data.map(item => item.nome));
      if(!productName) { //se non c'è RIFORMULA
        let newQuestion = await reformulateQuestion(question, supabase, llmIstance, chat_id);
        if (newQuestion) { 
          question = newQuestion;
          productName = extractProductName(question, product_names.data.map(item => item.nome));
          console.log("new productName", productName);
        }
      }
      
      // generation of the embedding
      const embed = await llmIstance.embeddings.create({
        model: 'nomic-embed-text',
        input: 'search_query: '+question
      });
      console.log("embed", embed);
      console.log("prova:", embed.data[0].embedding);
      if (productName) { //se c'è il nome del prodotto
        pdfs = await supabase.rpc('getpdfkey', { input: productName });
        pdfs = pdfs.data;
        if (typeof question === 'string' && !question.includes("App")) {
          pdfs = pdfs.filter(pdf => !pdf.includes("VIEWWRIT"));
        }
        //DA GUARDARE DA QUI
        chunk = await supabase.rpc('match_manuale', { query_embedding: embed.data[0].embedding, documents : pdfs });
        chunk=chunk.data;
        console.log("chunk", chunk);
      }
      let context =  chunk && chunk.length > 0 ? chunk.join('\n\n') : 'No documents found';
      
      // prompt
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: 'system',
          content: "Sei un chatbot utilizzato per aiutare gli installatori di un'importante azienda di impianti elettrici.\
          Puoi utilizzare solo i documenti sotto per rispondere alla domanda in maniera precisa.\
          Puoi usare massimo 200 parole.\
          Evita temi riguardanti politica, sesso, guerra e tutti temi volgari.\
          Se la domanda non riguarda i documenti che hai, chiedi all'utente di specificare il prodotto.\
          Non uscire dal contesto.\
          Documenti:"+context,
        },
        {
          role: 'user',
          content: question,
        },
      ];

      const completition = await llmIstance.chat.completions.create({
        model: 'deepseek-r1:14b',//'deepseek-v2:16b',
        temperature: 0.1,
        messages: messages,
      });
      console.log("-------------------");
      console.log("completition", completition);
      console.log("-------------------");
      let response = removeThinkTag(completition.choices[0].message.content);
      //updating chat
      const { error } = await supabase
        .from('messaggio')
        .update({domanda_embedding: embed.data.embedding, risposta: response})
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error generation embedding: ${error.message}`);
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
