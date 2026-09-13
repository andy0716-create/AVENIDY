
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = name.trim() || "AVENIDY User";
    localStorage.setItem("avenidy_user", JSON.stringify({ name: value }));
    router.push("/workspace");
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <a href="/" className="login-brand">
          <span>A</span>VE<span>N</span>I<span>D</span><span>Y</span>
        </a>

        <p className="login-kicker">WELCOME</p>
        <h1>Your workspace, ready.</h1>
        <p className="login-copy">
          v3 先用本機帳號原型。之後可以換成正式的 Email、Google 或學校帳號登入。
        </p>

        <form onSubmit={submit}>
          <label>
            Display name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </label>

          <button type="submit">Enter AVENIDY →</button>
        </form>

        <a className="back" href="/">← Back home</a>
      </div>
    </main>
  );
}
