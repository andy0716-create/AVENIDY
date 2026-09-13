
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;

    if (!apiKey || !baseUrl || !model) {
      return NextResponse.json(
        {
          demo: true,
          text:
            "AVENIDY AI 尚未設定模型。請在 .env.local 設定 AI_API_KEY、AI_BASE_URL 與 AI_MODEL；設定後，這個 Workspace 就會改用真正的 AI 回覆。",
        },
        { status: 200 }
      );
    }

    const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return NextResponse.json(
        { error: "AI provider error", detail: errorText.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const text =
      data?.choices?.[0]?.message?.content ??
      "AI 已回覆，但目前無法解析內容。";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
