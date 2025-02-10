import { NextResponse, NextRequest } from "next/server";
// import { createClient } from "@/src/utils/supabase/client";
import { createClient } from "@/src/utils/supabase/server";


export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    // get header
    const userid = request.headers.get('userid') == 'undefined' ? "00000000-0000-0000-0000-000000000000" : request.headers.get('userid');
    console.log('userid', userid);
    if(userid == "-1") {
      return NextResponse.json([], { status: 200 });
    }

    // prendere le conversazioni da Supabase view get_all_conversations
    const { data, error } = await supabase.from("get_all_conversations").select("*").eq("utente", userid);
    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
    console.log('data', data);
    return NextResponse.json({ conversations: data }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in GET /api/getAllConversation:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}