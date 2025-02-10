"use client";
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import styles from './navigator.module.css';
import { User } from '@supabase/supabase-js';
import { createClient } from "@/src/utils/supabase/client";
import { signInAnonymously } from '../app/(auth-pages)/login/actions';
import { getSession } from '@/src/utils/supabase/useUser'

const Navigator: React.FC = () => {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [prevPath, setPrevPath] = useState('');
  const [userInfo, setUserInfo] = useState<null | User>();

  /**
   * Check if the user is logged in
   * @author Yixin
   * @date 2025-01-06
   * @lastmodified 2025-01-06
   * @lastmodifiedby Yixin
   */
  useEffect(() => {
    const checkSession = async () => {
      let result = await getSession();
    
      if (result?.session == null) {
        console.log('No session found, sign in anonymously');
        const respons = await signInAnonymously();
        if(respons.data){
          document.cookie += `annon-session=${JSON.stringify(respons.data)}; path=/;`;
          result = await getSession();
        }
      }
      router.refresh();
      setIsLoggedIn(result.session != null && !result.session.user?.is_anonymous ? true : false);
      setUserInfo(result.session?.user);
      console.log('%cCUREENT USER:',"{background-color: red}", result.session?.user);
    }
    // Check session if the user is coming from login page to update the login status
    if (prevPath == "/login" || prevPath == "") {
      setPrevPath(pathname);
      checkSession();
    }

  }, [pathname, prevPath]);

  useEffect(() => {
    // register supbase on session update
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          if (!session?.user?.email) {
            return;
          }
          setIsLoggedIn(true);
          setUserInfo(session?.user);
        }
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      }
    );  
  }, 
    []
  );
  /**
   * Log out the user
   * @author Yixin
   * @date 2025-01-06
   * @lastmodified 2025-01-06
   * @lastmodifiedby Yixins
   */
  const handleSignOut = async () => {
    if (!isLoggedIn) return;
    const anonymousSession = localStorage.getItem("anonymousSession") || '{}';
    console.log('Anonymous session:', anonymousSession);
    const { error } = await supabase.auth.signOut();

    // cookie remove only supabase-auth-token, keep other cookies
    document.cookie = 'login-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';


    if (error) {
      console.error('Logout error:', error);
    } else {
      console.log('User logged out');
      setIsLoggedIn(false);
      if (anonymousSession) {
        const { token } = JSON.parse(anonymousSession);
        const { data, error: anonError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });
      }
      router.push("/");
    }
  };

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logoContainer}>
        <Image
          src="/images/logos/vimar-neg.svg"
          alt="Logo"
          width={150}
          height={100}
          className={styles.logoImage}
          priority
        />
      </Link>

      <ul className={styles.navLinks}>
        <li>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className={
              pathname === "/dashboard" ? styles.activeNavLink : styles.navLink
            }
            onClick={() => {
              if (!isLoggedIn) {
                router.push("/login");
              }
            }}
          >
            Dashboard
          </Link>
        </li>

        <li className={styles.separator}></li>

        <li>
          {isLoggedIn ? (
            <button className={styles.loginButton} onClick={handleSignOut}> {userInfo?.email?.split('@')[0]}, Sign Out </button>
          ) : (
            <div></div>
            // <Link href="/login">
            //   <button className={styles.loginButton}>Sign In</button>
            // </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navigator;
