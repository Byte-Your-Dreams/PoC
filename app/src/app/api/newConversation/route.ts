import { NextResponse } from "next/server";
// import { createClient } from "@/src/utils/supabase/client";
import { createClient } from "@/src/utils/supabase/server";

// import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const userID = body.utente;
    console.log("//===============Creating chat for user:", userID);
    
    if (!userID) {
      return NextResponse.json(
        { error: "userID is required" },
        { status: 400 }
      );
    }

    // const chatId = uuidv4();
    //const currentTime = new Date().toISOString();

    const { data, error } = await supabase
      .from("chat")
      .insert([
        {
          // id: chatId,
        //   utente: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        utente: body.utente,
        //  data: currentTime,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Chat created successfully", data });
  } catch (error: any) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat", details: error.message },
      { status: 500 }
    );
  }
}
