
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";
// import { supabase } from "@/app/utils/supabaseClient";


// export const POST = async (req: NextRequest) => {
//   try {
//     // Estrai i parametri dal corpo della richiesta
//     const { id, chat, domanda } = await req.json();

//     if (!id || !chat || !domanda) {
//       return NextResponse.json(
//         { error: "Parametri mancanti: id, chat o domanda non forniti." },
//         { status: 400 }
//       );
//     }

//     // Query al database per selezionare la riga specifica
//     const { data, error } = await supabase
//       .from("messaggio")
//       .select("risposta")
//       .eq("id", id)
//       .eq("chat", chat)
//       .eq("domanda", domanda)
//       .single(); // Assumendo che ci sia solo una riga corrispondente

//     if (error) {
//       console.error("Errore nella query al database:", error);
//       return NextResponse.json(
//         { error: "Errore nella query al database." },
//         { status: 500 }
//       );
//     }

//     if (!data) {
//       return NextResponse.json(
//         { error: "Nessuna riga trovata con i parametri forniti." },
//         { status: 404 }
//       );
//     }

//     // Restituisci il valore del campo "risposta" al frontend
//     return NextResponse.json({ risposta: data.risposta }, { status: 200 });
//   } catch (err) {
//     console.error("Errore durante la gestione della richiesta:", err);
//     return NextResponse.json(
//       { error: "Errore interno del server." },
//       { status: 500 }
//     );
//   }
//};

import { NextResponse, NextRequest } from "next/server";
// import { supabase } from "@/app/utils/supabaseClient";
import { createClient } from "@/src/utils/supabase/server";


export async function GET(request: NextRequest) {
  try {
    // get header
    const supabase = await createClient();
    const messageId = request.headers.get('messageId') == 'undefined' ? "00000000-0000-0000-0000-000000000000" : request.headers.get('messageId');
    
    console.log('=============================messageId', messageId);
    // prendere le conversazioni da Supabase view get_all_conversations
    const { data, error } = await supabase.from("messaggio").select().eq("id", messageId);
    if (error) {
      console.error("Error fetching message:", error);
      return NextResponse.json({ error: "Failed to fetch " }, { status: 500 });
    }

    return NextResponse.json({ conversations: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}