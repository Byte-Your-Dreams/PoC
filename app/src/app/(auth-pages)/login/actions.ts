'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/utils/supabase/server'
import { cookies } from 'next/headers'

const setCookie = async (key: string, value: string) => {
  (await
    // setcookie 
    cookies()).set(key , value || '', {
      path: '/',
    })
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const dataForm = {
    email: "admin@placeholder.com",
    password: 'password'//formData.get('password') as string,
  }

  const { data, error } = await supabase.auth.signInWithPassword(dataForm)
  if (error) {
    redirect('/error')
  }

  // setcookie 
  // console.log('you jump i jump')
  setCookie("login-session",JSON.stringify(data));
  // revalidatePath('/','layout')
  redirect('/dashboard')

 // redirect('/account')
}

// app/login/actions.ts

export async function signInAnonymously() {


  // 创建服务端客户端
  const supabase = await createClient()

  // 执行匿名登录
  const { data, error } = await supabase.auth.signInAnonymously()

  if (error) {
    return { error: error.message }
  }

  // 设置安全 Cookie
  if (data) {
    setCookie("annon-session",JSON.stringify(data));
  }

  return { data }
}