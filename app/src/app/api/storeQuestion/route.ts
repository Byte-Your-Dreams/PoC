import { NextRequest, NextResponse } from 'next/server';
// import { v4 as uuidv4 } from 'uuid';
// import { createClient } from "@/src/utils/supabase/client";
import { createClient } from "@/src/utils/supabase/server";


export const POST = async (req: NextRequest) => {
    const supabase = await createClient();
    try {
        const { chat, domanda } = await req.json();

        if (!chat || !domanda) {
            return NextResponse.json({ error: 'Missing chat or domanda' }, { status: 400 });
        }
        // const id = uuidv4();

        const { data, error } = await supabase
            .from('messaggio')
            .insert({ chat, domanda, risposta: null }).select();

        if (error) {
            console.error('Error inserting data:', error);
            return NextResponse.json({ error: 'Error inserting data' }, { status: 500 });
        }

        // console.log('Message inserted successfully:', data);
        return NextResponse.json({ message: 'Message inserted successfully', currentMessage:data}, { status: 200 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
};