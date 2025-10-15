// Netlify Function: dual recipients with defaults
// Env required: TELEGRAM_BOT_TOKEN
// Env optional: RECIPIENT_IDS (comma-separated). If empty, uses defaults below.
const DEFAULT_RECIPIENTS = ["436373024", "1747687413"];

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TOKEN) return { statusCode: 500, body: "Missing TELEGRAM_BOT_TOKEN" };

  const getHeader = (k)=>event.headers[k] || event.headers[k.toLowerCase()] || "";
  const contentType = getHeader("content-type");
  let data = {};
  if (contentType.includes("application/json")) data = JSON.parse(event.body || "{}");
  else { const p = new URLSearchParams(event.body || ""); for (const [k,v] of p.entries()) data[k]=v; }
  if (data["bot-field"]) return { statusCode: 200, body: "ok" };

  const payload = {
    name: data.name || "",
    whatsapp: data.whatsapp || "",
    preferred: data.preferred || "",
    utm_source: data.utm_source || "",
    utm_medium: data.utm_medium || "",
    utm_campaign: data.utm_campaign || "",
    utm_content: data.utm_content || "",
    ref: data.ref || ""
  };

  const list = (process.env.RECIPIENT_IDS || "").split(",").map(s=>s.trim()).filter(Boolean);
  const recipients = list.length ? list : DEFAULT_RECIPIENTS;

  const text = `🟡 Новый лид LemonMall
Имя: ${payload.name}
WhatsApp: ${payload.whatsapp}
Канал: ${payload.preferred}
UTM: ${payload.utm_source}/${payload.utm_medium}/${payload.utm_campaign}/${payload.utm_content}
Ref: ${payload.ref}`;

  try {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    await Promise.all(recipients.map(chat_id =>
      fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id, text }) })
    ));
    return { statusCode: 302, headers: { Location: "/thanks/" } };
  } catch (err) {
    return { statusCode: 500, body: "Lead processing failed" };
  }
}
