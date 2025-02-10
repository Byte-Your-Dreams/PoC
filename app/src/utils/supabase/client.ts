import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = () =>{
  const URL = `${window.location.protocol}//${window.location.hostname}:${process.env.NEXT_PUBLIC_SUPABASE_URL_PORT}`;
  
  if(process.env.NEXT_PUBLIC_SUPABASE_URL_PORT === undefined){
    throw new Error("The environment variable NEXT_PUBLIC_SUPABASE_URL_PORT is not defined!");
  }
  return createBrowserClient(
      URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}
