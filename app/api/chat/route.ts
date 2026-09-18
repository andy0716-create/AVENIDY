import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 8_000;
const MAX_TOTAL_LENGTH = 48_000;
const PROVIDER_TIMEOUT_MS = 30_000;

type ChatMode = "Think" | "Learn" | "Build";
type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

const modeInstructions: Record<ChatMode, string> = {
  Think:
    "THINK 模式：先釐清目標與假設，把複雜問題拆成可處理的部分；比較選項與取捨，最後給出明確建議和下一步。",
  Learn:
    "LEARN 模式：依使用者程度由直覺到細節解釋；搭配具體例子、重點整理，必要時提供一個簡短的理解檢查或練習。",
  Build:
    "BUILD 模式：把需求轉成可執行成果；優先提供具體步驟、可直接使用的內容或程式碼，並補上關鍵測試、風險與下一步。",
};

function systemPrompt(mode: ChatMode) {
  return `你是 AVENIDY，一位專注、可靠、務實的 AI 協作夥伴。

回覆規則：
- 預設使用自然、專業的繁體中文（台灣用語）；若使用者明確要求其他語言，則遵從要求。
- 先直接回答核心問題，再補充必要的理由、步驟或例子；避免空泛開場與重複使用者的問題。
- 資訊不足但仍可安全前進時，明確說明合理假設後繼續；只有在答案會因此大幅改變時才提出澄清問題。
- 不確定時誠實說明，不捏造資料、來源、執行結果或你未具備的能力。
- 以清楚的短段落、標題與項目符號組織內容；不要為了格式而過度分段。
- 涉及程式碼時，提供可執行、相互一致的範例，並指出檔案位置、驗證方式與重要風險。
- 涉及高風險的醫療、法律或財務問題時，提醒限制並鼓勵向合格專業人士確認。

${modeInstructions[mode]}`;
}

function jsonError(
  status: number,
  code: string,
  message: string,
  setup?: string
) {
  return NextResponse.json(
    { error: { code, message, ...(setup ? { setup } : {}) } },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function normalizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const messages: ChatMessage[] = [];
  let totalLength = 0;

  for (const item of value.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") return null;

    const role = "role" in item ? item.role : undefined;
    const content = "content" in item ? item.content : undefined;

    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    ) {
      return null;
    }

    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;

    totalLength += trimmed.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;

    messages.push({ role, content: trimmed });
  }

  return messages.some((message) => message.role === "user") ? messages : null;
}

function providerEndpoint(baseUrl: string, model: string) {
  try {
    const url = new URL(baseUrl);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
      return null;
    }

    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
    if (
      model.startsWith("gpt-") &&
      (url.hostname !== "api.openai.com" || normalizedPath !== "/v1")
    ) {
      return null;
    }

    return `${url.toString().replace(/\/$/, "")}/chat/completions`;
  } catch {
    return null;
  }
}

function extractText(data: unknown) {
  if (!data || typeof data !== "object" || !("choices" in data)) return null;

  const choices = data.choices;
  if (!Array.isArray(choices)) return null;

  const first = choices[0];
  if (!first || typeof first !== "object" || !("message" in first)) return null;

  const message = first.message;
  if (!message || typeof message !== "object" || !("content" in message)) {
    return null;
  }

  const content = message.content;
  if (typeof content === "string") return content.trim() || null;

  if (Array.isArray(content)) {
    const text = content
      .flatMap((part) => {
        if (!part || typeof part !== "object" || !("text" in part)) return [];
        return typeof part.text === "string" ? [part.text] : [];
      })
      .join("\n")
      .trim();

    return text || null;
  }

  return null;
}

function providerNetworkErrorCode(error: unknown) {
  if (!(error instanceof Error)) return undefined;

  const cause = (error as Error & { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object" || !("code" in cause)) {
    return undefined;
  }

  return typeof cause.code === "string" ? cause.code : undefined;
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_REQUEST", "請求格式不正確，請重新送出。");
  }

  if (!body || typeof body !== "object") {
    return jsonError(400, "INVALID_REQUEST", "請求格式不正確，請重新送出。");
  }

  const rawMode = "mode" in body ? body.mode : undefined;
  if (rawMode !== "Think" && rawMode !== "Learn" && rawMode !== "Build") {
    return jsonError(400, "INVALID_MODE", "無法辨識目前模式，請重新選擇後再試。");
  }

  const rawMessages = "messages" in body ? body.messages : undefined;
  const messages = normalizeMessages(rawMessages);
  if (!messages) {
    return jsonError(
      400,
      "INVALID_MESSAGES",
      "對話內容為空白、過長或格式不正確，請調整後再試。"
    );
  }

  const apiKey = process.env.AI_API_KEY?.trim();
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!apiKey || !baseUrl || !model) {
    return jsonError(
      503,
      "CONFIGURATION_ERROR",
      "AVENIDY 的 AI 服務尚未完成設定。",
      "請在 Vercel 專案的 Settings → Environment Variables 設定 AI_API_KEY、AI_BASE_URL、AI_MODEL，然後重新部署。金鑰只應保存在伺服器環境變數中。"
    );
  }

  if (!/^[\x21-\x7E]+$/.test(apiKey)) {
    return jsonError(
      503,
      "CONFIGURATION_ERROR",
      "AVENIDY 的 AI 金鑰格式不正確。",
      "請將 AI_API_KEY 的示意文字替換成供應商提供的真正 API 金鑰；請勿加入引號、空格或中文。"
    );
  }

  const endpoint = providerEndpoint(baseUrl, model);
  if (!endpoint) {
    return jsonError(
      503,
      "CONFIGURATION_ERROR",
      "AVENIDY 的 AI 服務網址設定無效。",
      "請檢查 AI_BASE_URL；若 AI_MODEL 使用 OpenAI 的 gpt- 模型，請將網址完整填為 https://api.openai.com/v1。"
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  let upstream: Response;

  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt(rawMode) },
          ...messages,
        ],
        temperature: 0.45,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(
        504,
        "PROVIDER_TIMEOUT",
        "AI 服務回覆時間過長，請稍後再試。"
      );
    }

    const networkCode = providerNetworkErrorCode(error);

    console.error("[api/chat] provider request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: networkCode,
    });

    if (networkCode === "ENOTFOUND" || networkCode === "EAI_AGAIN") {
      return jsonError(
        503,
        "PROVIDER_DNS_ERROR",
        "目前找不到 AI 服務主機。",
        "請確認 Vercel 的 AI_BASE_URL 完整且正確；若使用 OpenAI，請填 https://api.openai.com/v1。"
      );
    }

    if (
      networkCode === "UND_ERR_CONNECT_TIMEOUT" ||
      networkCode === "ETIMEDOUT"
    ) {
      return jsonError(
        504,
        "PROVIDER_TIMEOUT",
        "AI 服務連線逾時，請稍後再試。"
      );
    }

    return jsonError(
      503,
      "PROVIDER_UNAVAILABLE",
      "目前無法連線到 AI 服務，請稍後再試。",
      "請確認 Vercel 的 AI_BASE_URL 是供應商的 API 基底網址，且未包含 /chat/completions。"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream.ok) {
    console.error("[api/chat] provider returned an error", {
      status: upstream.status,
      requestId: upstream.headers.get("x-request-id") ?? undefined,
    });

    if (upstream.status === 401 || upstream.status === 403) {
      return jsonError(
        502,
        "PROVIDER_AUTH_ERROR",
        "AI 服務驗證失敗，請管理員檢查伺服器端設定。"
      );
    }

    if (upstream.status === 429) {
      return jsonError(
        429,
        "RATE_LIMITED",
        "AI 服務目前請求較多，請稍候片刻再試。"
      );
    }

    if (upstream.status >= 500) {
      return jsonError(
        503,
        "PROVIDER_UNAVAILABLE",
        "AI 服務暫時無法使用，請稍後再試。"
      );
    }

    return jsonError(
      502,
      "PROVIDER_ERROR",
      "AI 服務未能完成這次回覆，請調整問題後再試。"
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return jsonError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "AI 服務回傳了無法辨識的內容，請稍後再試。"
    );
  }

  const text = extractText(data);
  if (!text) {
    return jsonError(
      502,
      "INVALID_PROVIDER_RESPONSE",
      "AI 服務沒有回傳可顯示的內容，請再試一次。"
    );
  }

  return NextResponse.json(
    { text, mode: rawMode },
    { headers: { "Cache-Control": "no-store" } }
  );
}
