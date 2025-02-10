import { NextRequest, NextResponse } from 'next/server';
// import { v4 as uuidv4 } from 'uuid';
import { createClient } from "@/src/utils/supabase/server";
// import { createClient } from "@/src/utils/supabase/client";

export const POST = async (req: NextRequest) => {
    const supabase = createClient();
    try {

        console.log('eq content:', req);

        const { chat_id } = await req.json();
        console.log('chat_id:', chat_id);
        
        if (!chat_id) {
            return NextResponse.json({ error: 'A problem occurred before the execution of the function' }, { status: 400 });
        }

        const { data, error } = await supabase.from('chat').delete().eq('id', chat_id);

        if (error) {
            console.error('Error deleting chat:', error);
            return NextResponse.json({ error: 'Error deleting chat' }, { status: 500 });
        }

        // console.log('Chat deleted successfully:', data);
        return NextResponse.json({ message: 'Chat deleted successfully'}, { status: 200 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
    }
};