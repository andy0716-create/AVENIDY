"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./workspace.css";

type ChatMode = "Think" | "Learn" | "Build";
type Message = { role: "user" | "assistant"; text: string };
type SavedSession = {
  id: string;
  title: string;
  mode?: ChatMode;
  messages: Message[];
};
type Notice = {
  kind: "setup" | "warning" | "error";
  title: string;
  message: string;
  setup?: string;
};
type FailedRequest = { messages: Message[]; mode: ChatMode };
type ChatApiResponse = {
  text?: unknown;
  error?: { code?: unknown; message?: unknown; setup?: unknown };
};

const initialMessage: Message = {
  role: "assistant",
  text: "你好，我是 AVENIDY。選擇 Think、Learn 或 Build，告訴我你現在想解決什麼，我會陪你把它推進。",
};

const modeContent: Record<
  ChatMode,
  {
    label: string;
    title: string;
    description: string;
    currentMode: string;
    placeholder: string;
    waiting: string;
    starters: string[];
  }
> = {
  Think: {
    label: "思考",
    title: "把複雜問題想清楚。",
    description: "拆解問題、比較取捨，找到值得採取的下一步。",
    currentMode: "釐清假設、分析選項並形成判斷。",
    placeholder: "輸入一個問題、想法或需要判斷的選擇…",
    waiting: "正在整理脈絡與關鍵取捨…",
    starters: [
      "幫我拆解這個問題，找出真正的核心",
      "比較兩個選項的優缺點，並給我建議",
      "把這個模糊想法整理成清楚的方向",
      "幫我找出這個計畫最可能忽略的風險",
    ],
  },
  Learn: {
    label: "學習",
    title: "真正理解，再記得更久。",
    description: "從直覺、例子到練習，依你的程度建立完整理解。",
    currentMode: "解釋概念、整理重點並檢查理解。",
    placeholder: "輸入你想學習、複習或練習的內容…",
    waiting: "正在組織最容易理解的說明…",
    starters: [
      "幫我把光合作用整理成會考複習筆記",
      "用生活例子解釋一個我不懂的概念",
      "幫我設計 20 分鐘的複習與小測驗",
      "先評估我的程度，再教我這個主題",
    ],
  },
  Build: {
    label: "實作",
    title: "把想法做成可用的成果。",
    description: "把需求化為步驟、內容與可驗證的實作。",
    currentMode: "規劃、實作、測試並交付具體成果。",
    placeholder: "描述你想製作的網站、App、程式或內容…",
    waiting: "正在把需求轉成可執行方案…",
    starters: [
      "幫我規劃一個 Next.js 專案",
      "解釋這段程式碼為什麼會出錯並修正",
      "把我的需求整理成可執行的開發清單",
      "幫我寫出第一個可運作的版本",
    ],
  },
};

function isChatMode(value: unknown): value is ChatMode {
  return value === "Think" || value === "Learn" || value === "Build";
}

function parseNotice(response: ChatApiResponse | null): Notice {
  const code =
    typeof response?.error?.code === "string"
      ? response.error.code
      : "UNKNOWN_ERROR";
  const message =
    typeof response?.error?.message === "string"
      ? response.error.message
      : "目前無法取得 AI 回覆，請稍後再試。";
  const setup =
    typeof response?.error?.setup === "string"
      ? response.error.setup
      : undefined;

  if (code === "CONFIGURATION_ERROR" || code === "PROVIDER_AUTH_ERROR") {
    return {
      kind: "setup",
      title: "AI 服務需要完成設定",
      message,
      setup,
    };
  }

  if (code === "RATE_LIMITED") {
    return {
      kind: "warning",
      title: "服務目前比較忙碌",
      message,
    };
  }

  return {
    kind: "error",
    title: "這次沒有成功送出",
    message,
  };
}

function MessageContent({ text }: { text: string }) {
  const parts = text.split("```");

  return (
    <div className="message-content">
      {parts.map((part, index) => {
        if (!part) return null;

        if (index % 2 === 1) {
          const lines = part.replace(/^\n/, "").split("\n");
          const firstLine = lines[0]?.trim() ?? "";
          const hasLanguage =
            lines.length > 1 && /^[a-z0-9#+.-]{1,20}$/i.test(firstLine);
          const code = hasLanguage ? lines.slice(1).join("\n") : lines.join("\n");

          return (
            <pre key={index}>
              <code>{code.trimEnd()}</code>
            </pre>
          );
        }

        return <p key={index}>{part}</p>;
      })}
    </div>
  );
}

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("Think");
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [userName, setUserName] = useState("Guest");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const [saveLabel, setSaveLabel] = useState("儲存");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("avenidy_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { name?: unknown };
        if (typeof parsed.name === "string" && parsed.name.trim()) {
          setUserName(parsed.name.trim());
        }
      } catch {
        // Ignore legacy or malformed local data.
      }
    }

    const rawSessions = localStorage.getItem("avenidy_sessions");
    if (rawSessions) {
      try {
        const parsed = JSON.parse(rawSessions) as unknown;
        if (Array.isArray(parsed)) {
          setSessions(parsed as SavedSession[]);
        }
      } catch {
        // Ignore legacy or malformed local data.
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, notice]);

  const activeMode = modeContent[mode];
  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy]);

  function persist(next: SavedSession[]) {
    setSessions(next);
    localStorage.setItem("avenidy_sessions", JSON.stringify(next));
  }

  function saveCurrent() {
    const title =
      messages.find((message) => message.role === "user")?.text.slice(0, 34) ||
      `${mode} 工作階段`;
    const session: SavedSession = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      title,
      mode,
      messages,
    };

    persist([session, ...sessions].slice(0, 12));
    setSaveLabel("已儲存");
    window.setTimeout(() => setSaveLabel("儲存"), 1600);
  }

  function loadSession(session: SavedSession) {
    setMessages(session.messages);
    if (isChatMode(session.mode)) setMode(session.mode);
    setNotice(null);
    setFailedRequest(null);
  }

  function startNewSession() {
    setMessages([initialMessage]);
    setInput("");
    setNotice(null);
    setFailedRequest(null);
  }

  async function requestReply(requestMessages: Message[], requestMode: ChatMode) {
    setBusy(true);
    setNotice(null);
    setFailedRequest(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 38_000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: requestMode,
          messages: requestMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
        signal: controller.signal,
      });

      const data = (await res.json().catch(() => null)) as ChatApiResponse | null;

      if (!res.ok || typeof data?.text !== "string" || !data.text.trim()) {
        setNotice(parseNotice(data));
        setFailedRequest({ messages: requestMessages, mode: requestMode });
        return;
      }

      setMessages([
        ...requestMessages,
        { role: "assistant", text: data.text.trim() },
      ]);
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      setNotice({
        kind: "error",
        title: timedOut ? "等待時間過長" : "無法連線到 AVENIDY",
        message: timedOut
          ? "AI 服務沒有及時回覆。你可以保留原本的問題並再試一次。"
          : "請確認網路連線後再試；你的問題仍保留在這個工作階段。",
      });
      setFailedRequest({ messages: requestMessages, mode: requestMode });
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || busy) return;

    const nextMessages = [...messages, { role: "user" as const, text: value }];
    setMessages(nextMessages);
    setInput("");
    void requestReply(nextMessages, mode);
  }

  function retry() {
    if (!failedRequest || busy) return;
    setMessages(failedRequest.messages);
    void requestReply(failedRequest.messages, failedRequest.mode);
  }

  async function copyMessage(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch {
      setNotice({
        kind: "error",
        title: "無法複製回覆",
        message: "瀏覽器沒有允許剪貼簿存取，請手動選取文字複製。",
      });
    }
  }

  return (
    <main className="ws-page">
      <header className="ws-topbar">
        <a className="ws-logo" href="/" aria-label="回到 AVENIDY 首頁">
          <span>A</span>VE<span>N</span>I<span>D</span><span>Y</span>
        </a>

        <div className="mode-switcher" aria-label="選擇 AI 工作模式">
          {(["Think", "Learn", "Build"] as const).map((item) => (
            <button
              key={item}
              className={mode === item ? "active" : ""}
              onClick={() => setMode(item)}
              aria-pressed={mode === item}
              disabled={busy}
            >
              <span>{item}</span>
              <small>{modeContent[item].label}</small>
            </button>
          ))}
        </div>

        <div className="top-actions">
          <span>{userName}</span>
          <button onClick={saveCurrent}>{saveLabel}</button>
        </div>
      </header>

      <div className="ws-shell">
        <aside className="ws-sidebar">
          <div>
            <p className="side-label">WORKSPACE</p>
            <h2>My AVENIDY</h2>

            <button className="new-session" onClick={startNewSession}>
              <span>＋</span> 新工作階段
            </button>

            <div className="saved-list">
              <p className="side-label">SAVED</p>
              {sessions.length === 0 ? (
                <span className="empty">尚未儲存任何工作階段</span>
              ) : (
                sessions.map((session) => (
                  <button key={session.id} onClick={() => loadSession(session)}>
                    {session.title}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="side-bottom">
            <p className="side-label">CURRENT MODE</p>
            <strong>{mode}</strong>
            <span>{activeMode.currentMode}</span>
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-heading">
            <p>AVENIDY INTELLIGENCE · {mode.toUpperCase()}</p>
            <h1>{activeMode.title}</h1>
            <span>{activeMode.description}</span>
          </div>

          <div className="starter-grid" aria-label={`${mode} 建議提問`}>
            {activeMode.starters.map((starter) => (
              <button key={starter} onClick={() => send(starter)} disabled={busy}>
                <span>＋</span>
                {starter}
              </button>
            ))}
          </div>

          <div className="conversation" aria-live="polite">
            <div className="messages">
              {messages.map((message, index) => (
                <article key={index} className={`message ${message.role}`}>
                  <div className="message-meta">
                    <span className="message-role">
                      {message.role === "assistant" ? "AVENIDY" : "YOU"}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        className="copy-button"
                        onClick={() => void copyMessage(message.text, index)}
                        aria-label="複製這則回覆"
                      >
                        {copiedIndex === index ? "已複製" : "複製"}
                      </button>
                    )}
                  </div>
                  <MessageContent text={message.text} />
                </article>
              ))}

              {busy && (
                <article className="message assistant pending" aria-label="AI 正在回覆">
                  <div className="message-role">AVENIDY</div>
                  <div className="thinking-line">
                    <span className="thinking-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <p>{modeContent[failedRequest?.mode ?? mode].waiting}</p>
                  </div>
                </article>
              )}
            </div>

            {notice && (
              <aside className={`status-card ${notice.kind}`} role="alert">
                <div>
                  <p className="status-eyebrow">
                    {notice.kind === "setup" ? "SETUP REQUIRED" : "PLEASE TRY AGAIN"}
                  </p>
                  <h2>{notice.title}</h2>
                  <p>{notice.message}</p>
                  {notice.setup && <p className="setup-guidance">{notice.setup}</p>}
                  {notice.kind === "setup" && (
                    <p className="secret-note">
                      請勿把任何 API 金鑰貼到聊天內容或前端程式碼中。
                    </p>
                  )}
                </div>
                {failedRequest && (
                  <button onClick={retry} disabled={busy}>
                    再試一次
                  </button>
                )}
              </aside>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="composer-wrap">
            <div className="composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={activeMode.placeholder}
                aria-label="輸入給 AVENIDY 的訊息"
                maxLength={8_000}
                disabled={busy}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <button className="send-btn" disabled={!canSend} onClick={() => send()}>
                {busy ? "回覆中…" : "送出 →"}
              </button>
            </div>
            <div className="composer-note">
              <span>Enter 送出 · Shift + Enter 換行</span>
              <span>AI 可能出錯，重要資訊請再次確認</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
