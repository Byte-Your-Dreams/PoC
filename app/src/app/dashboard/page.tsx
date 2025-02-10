"use client";
import styles from './page.module.css';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from "@/src/utils/supabase/useUser";
import { handleClientScriptLoad } from 'next/script';


export default function Dashboard() {
  const user = getUser();
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [router]);

const handleScrapy = async () => {
  console.log('Scrapy!');

  try {
    const response = await fetch("api/updateScrapy", {
      method: "POST",
    });

    const data = await response.json();
    if (data.status === "success") {
      console.log("Scraping avviato con successo");
    } else {
      console.error("Errore durante l'avvio dello scraping:", data.message);
    }
  } catch (error) {
    console.error("Errore:", error);
  }
};



  return (
    <div id="dashboard" className={styles.dashboard}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Pannello di Controllo</h1>
        <button className={styles.scrapyButton} onClick={handleScrapy}>Aggiorna</button>
      </div>
      <div className={styles.gridContainer}>
        {/* Numero Totale delle Richieste */}
        <div className={styles.card}>
          <h2>Statistiche sulle Richieste</h2>
          <p>Richieste Conversazione Libera:</p>
          <p>Richieste Conversazione Guidata:</p>
          <p>Numero Totale delle Richieste:</p>
        </div>

        {/* Statistiche sulle Parole Chiave */}
        <div className={styles.card}>
          <h2>Statistiche sulle Parole Chiave</h2>
          {/* <canvas id="keyword-chart"></canvas> */}
        </div>

        {/* Andamento Giornaliero */}
        <div className={styles.card}>
          <h2>Andamento Giornaliero</h2>
          {/* <canvas id="daily-trend-chart"></canvas> */}
        </div>

        {/* Statistiche sul Feedback */}
        <div className={styles.card}>
          <h2>Statistiche sul Feedback</h2>
          <p>Feedback Positivo: <span id="positive-feedback"></span></p>
          <p>Feedback Negativo: <span id="negative-feedback"></span></p>
          {/* <canvas id="feedback-pie-chart"></canvas> */}
        </div>
      </div>
    </div>
  );
}
