
"use client";

import { useEffect, useMemo, useState } from "react";
import "./workspace.css";

type Message = { role: "user" | "assistant"; text: string };
type SavedSession = { id: string; title: string; messages: Message[] };

const starters = [
  "幫我把光合作用整理成會考複習筆記",
  "幫我規劃一個 Next.js 專案",
  "解釋這段程式碼為什麼會出錯",
  "幫我把今天要讀的內容分成 3 個階段",
];

export default function WorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "歡迎來到 AVENIDY Workspace。你可以從學習、程式或專案開始。" },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"Think" | "Learn" | "Build">("Think");
  const [busy, setBusy] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    const rawUser = localStorage.getItem("avenidy_user");
    if (rawUser) {
      try {
        setUserName(JSON.parse(rawUser).name || "Guest");
      } catch {}
    }

    const rawSessions = localStorage.getItem("avenidy_sessions");
    if (rawSessions) {
      try {
        setSessions(JSON.parse(rawSessions));
      } catch {}
    }
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy]);

  function persist(next: SavedSession[]) {
    setSessions(next);
    localStorage.setItem("avenidy_sessions", JSON.stringify(next));
  }

  function saveCurrent() {
    const title =
      messages.find((m) => m.role === "user")?.text.slice(0, 34) ||
      `${mode} session`;
    const session: SavedSession = {
      id: `${Date.now()}`,
      title,
      messages,
    };
    persist([session, ...sessions].slice(0, 12));
  }

  function loadSession(session: SavedSession) {
    setMessages(session.messages);
  }

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || busy) return;

    const userMessage: Message = { role: "user", text: value };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        }),
      });

      const data = await res.json();

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          text:
            data?.text ||
            "目前無法取得 AI 回覆，請稍後再試。",
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          text: "AVENIDY 目前連不到 AI 服務。請確認網路與伺服器設定。",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ws-page">
      <header className="ws-topbar">
        <a className="ws-logo" href="/">
          <span>A</span>VE<span>N</span>I<span>D</span><span>Y</span>
        </a>

        <div className="mode-switcher">
          {(["Think", "Learn", "Build"] as const).map((item) => (
            <button
              key={item}
              className={mode === item ? "active" : ""}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="top-actions">
          <span>{userName}</span>
          <button onClick={saveCurrent}>Save</button>
        </div>
      </header>

      <div className="ws-shell">
        <aside className="ws-sidebar">
          <div>
            <p className="side-label">WORKSPACE</p>
            <h2>My AVENIDY</h2>

            <button
              className="new-session"
              onClick={() =>
                setMessages([
                  {
                    role: "assistant",
                    text: "新的工作階段已建立。你想從哪裡開始？",
                  },
                ])
              }
            >
              + New session
            </button>

            <div className="saved-list">
              <p className="side-label">SAVED</p>
              {sessions.length === 0 ? (
                <span className="empty">No saved sessions yet.</span>
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
            <span>
              {mode === "Think" && "Break down ideas and questions."}
              {mode === "Learn" && "Understand, review, and practice."}
              {mode === "Build" && "Turn ideas into projects."}
            </span>
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-heading">
            <p>AVENIDY INTELLIGENCE</p>
            <h1>{mode} with focus.</h1>
          </div>

          <div className="starter-grid">
            {starters.map((starter) => (
              <button key={starter} onClick={() => send(starter)}>
                <span>+</span>
                {starter}
              </button>
            ))}
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <article key={index} className={`message ${message.role}`}>
                <div className="message-role">
                  {message.role === "assistant" ? "AVENIDY" : "YOU"}
                </div>
                <p>{message.text}</p>
              </article>
            ))}

            {busy && (
              <article className="message assistant">
                <div className="message-role">AVENIDY</div>
                <p>Thinking…</p>
              </article>
            )}
          </div>

          <div className="composer-wrap">
            <div className="composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "Learn"
                    ? "輸入你想學習或複習的內容…"
                    : mode === "Build"
                    ? "描述你想製作的網站、App 或程式…"
                    : "輸入一個問題、想法或任務…"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="send-btn" disabled={!canSend} onClick={() => send()}>
                {busy ? "..." : "Send →"}
              </button>
            </div>
            <p className="prototype-note">
              v3 · AI API route + local account + saved sessions
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
