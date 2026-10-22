import { getSeoTenant, absoluteUrl } from "@/lib/tenant/seo";

export const dynamic = "force-dynamic";

// Plain-text, LLM-friendly site summary (llms.txt standard).
export async function GET() {
  const seo = await getSeoTenant();
  const u = (p: string) => absoluteUrl(seo, p);

  const lines: string[] = [];

  if (seo.isPlatform) {
    lines.push(
      "# ZENEX Sports League Platform",
      "",
      "> 為業餘及企業足球聯賽提供開箱即用嘅專屬聯賽網站：賽程、賽果、即時積分榜、球隊與球員管理、中英雙語，由 ZENEX SPORTS 營運。",
      "",
      "## 呢個平台係咩",
      "- 一個 SaaS：每個聯賽獲得獨立子網域同管理後台。",
      "- 功能：對戰表、賽果錄入、自動積分榜、球員名單、隊伍管理、PDF 出場表。",
      "- 對象：企業聯賽、業餘聯賽、學校或社區盃賽嘅主辦單位。",
      "",
      "## 申請",
      `- 開辦聯賽：${u("/apply")}`,
      "",
      "## 常見問題",
      "- 要唔要自己整網站？唔使，平台已包含對外公開頁同管理後台。",
      "- 支援幾多語言？中文（繁體）同英文。",
      "- 可唔可以自訂聯賽名稱同品牌？可以，每個租戶有獨立名稱、配色同公告。",
      "",
      "## 範例聯賽",
      `- HKBankLeague 2026：${u("/")}`,
      "",
    );
  } else {
    const name = seo.leagueName ?? "Hong Kong Bank League 2026";
    lines.push(
      `# ${name}`,
      "",
      "> 香港銀行業足球聯賽官方資訊平台，提供即時賽程、賽果、積分榜、球隊與球員資料。由 ZENEX SPORTS 提供技術支援。",
      "",
      "## 公開頁面",
      `- 賽程與賽果：${u("/fixtures")}`,
      `- 球隊：${u("/teams")}`,
      `- 球員：${u("/players")}`,
      `- 對戰往績：${u("/head-to-head")}`,
      `- 賽事簡介：${u("/overview")}`,
      `- 聯絡：${u("/contacts")}`,
      "",
      "## 常見問題",
      "- 幾時更新賽果？比賽完成後由大會即時錄入，積分榜自動更新。",
      "- 點樣搵某隊波嘅賽程？於「球隊」頁選擇隊伍，或用「賽程」篩選。",
      "",
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
