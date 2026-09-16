"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function recordLogin(accessToken: string) {
    await fetch("/api/login-log", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (data.session?.access_token) {
        await recordLogin(data.session.access_token);
      }
      router.push("/workspace");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登入失敗，請再試一次。");
    } finally {
      setBusy(false);
    }
  }

  async function signUp() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.session?.access_token) {
        await recordLogin(data.session.access_token);
        router.push("/workspace");
        return;
      }
      setMessage("註冊成功。若 Supabase 啟用了 Email 驗證，請先到信箱完成驗證。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "註冊失敗，請再試一次。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <a href="/" className="login-brand">
          <span>A</span>VE<span>N</span>I<span>D</span><span>Y</span>
        </a>

        <p className="login-kicker">SECURE ACCESS</p>
        <h1>Your workspace, ready.</h1>
        <p className="login-copy">
          使用 Email 與密碼登入。成功登入後，AVENIDY 會安全記錄登入時間與基本裝置資訊，供管理後台查看。
        </p>

        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <button type="submit" disabled={busy}>{busy ? "Please wait…" : "Sign in →"}</button>
          <button className="secondary" type="button" onClick={signUp} disabled={busy}>Create account</button>
        </form>

        {message && <p className="login-message">{message}</p>}
        <a className="back" href="/">← Back home</a>
      </div>
    </main>
  );
}
