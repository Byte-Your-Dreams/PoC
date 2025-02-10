import { NextResponse,NextRequest } from "next/server";
// import { createClient } from "@/src/utils/supabase/client";
import { createClient } from "@/src/utils/supabase/server";

export async function POST(req: NextRequest) {
    if (req.method !== "POST") {
        return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }
  
    try {
      // 调用 scraping server 的 API 地址
      const URL = `${window.location.protocol}//${window.location.hostname}:6800/schedule.json`;
      const scrapingUrl = URL;
  
      // 请求 payload
      const payload = new URLSearchParams({
        project: "Vimar",
        spider: "SpiderVimar",
      });
  
      // 通过 fetch 向 scraping server 发出 POST 请求
      const response = await fetch(scrapingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
      });
  
      // 检查响应状态
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          status: "success",
          message: "Scraping avviato con successo",
          details: data,
        }, { status: 200 });
      } else {
        const errorText = await response.text();
        return NextResponse.json({
          status: "error",
          message: `Errore nel server di scraping: ${response.status}`,
          details: errorText,
        }, { status: response.status });
      }
    } catch (error) {
      console.error("Errore:", error);
      return NextResponse.json({
        status: "error",
        message: "Errore durante il tentativo di avviare lo scraping",
        details: error.message,
      }, { status: 500 });
    }
  }