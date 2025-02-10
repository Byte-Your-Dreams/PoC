/**
 * This is a custom hook functions that checks the user's session 
 * and returns the user's information.
 * @author Yixin
 */
import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/client";
import { cookies } from "next/headers";


// Check the current session
export const getSession = async () => {
  const supabase = createClient();

  const getSessionCookie = (anno=false) => {
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[key.trim()] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    let sessionData = cookies["login-session"]|| cookies["annon-session"];
    if(anno){
      sessionData = cookies["annon-session"];
    }
    
    // console.log('===========================');
    // console.log('Login session:', JSON.parse(cookies["login-session"]||"[]"));
    // console.log("Annon session:", JSON.parse(cookies["annon-session"]||"[]"));
    // console.log('===========================');

    if (sessionData) {
      const { session } =(JSON.parse(sessionData));
      const { access_token, refresh_token } = session || {};
      if (access_token && refresh_token) {
        console.log('Session data return:', { access_token, refresh_token });
        return { access_token, refresh_token };
      }
    }
    return { access_token: "", refresh_token: "" };
  };

  //======================================

  let sessionCookie = getSessionCookie(); // { access_token: "", refresh_token: "" }
  if (sessionCookie.access_token && sessionCookie.refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token: sessionCookie.access_token, refresh_token: sessionCookie.refresh_token });
    // console.log('Session found, and setted', error);
  }else{
    //await supabase.auth.signOut();
    // console.log('No session found');
    return { session: null };
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }
    // console.log('return Session:', data);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * This function gets the user's information.
 * @returns {User | null} the user's information.
 * @throws {Error} if there is an error.
 * @example
 * const user = getUser();
 * console.log(user);
 * @autor Yixin
 * @data 2025-01-06
 * @lastmodified 2025-01-06
 * @lastmodifiedby Yixin
 */
export const getUser = async () => {
  const { session } = await getSession();
  return session?.user || null;
}

/**
 * This function checks if the user is anonymous.
 * @returns {boolean} true if the user is anonymous, false otherwise.
 * @throws {Error} if there is an error.
 * @example
 * const isAnonymous = isUserAnonymous();
 * console.log(isAnonymous);
 * @autor Yixin
 * @data 2025-01-06
 * @lastmodified 2025-01-06
 * @lastmodifiedby Yixin
 */
export const isUserAnonymous = async () => {
  const { session } = await getSession();
  return session?.user?.is_anonymous || false;
}