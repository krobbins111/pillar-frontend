import { useState } from "react";
import { api } from "../api";
import { signIn } from "../lib/session";
import Brand from "./Brand";

// The sign-in page: a name and a pass phrase, once per phone or tablet. Nothing fancy; it keeps out anyone who
// happens to find the link.
export default function SignIn({ onSignedIn }) {
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phrase.trim()) {
      setProblem("Type your name and your pass phrase.");
      return;
    }
    setBusy(true);
    setProblem("");
    try {
      const session = await api.login(name, phrase);
      signIn(session);
      onSignedIn(session.user);
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="signin">
      <form className="signin__card" onSubmit={submit} noValidate>
        <Brand />
        <h1 className="signin__title">Welcome</h1>
        <p className="signin__lead">Sign in once on this phone or tablet. It will remember you after that.</p>
        <label className="signin__field">
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="words"
            autoCorrect="off" spellCheck={false} autoFocus />
        </label>
        <label className="signin__field">
          <span>Pass phrase</span>
          <span className="signin__phrase">
            <input type={show ? "text" : "password"} value={phrase} onChange={(e) => setPhrase(e.target.value)}
              autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <button type="button" className="signin__show" onClick={() => setShow((s) => !s)} aria-pressed={show}>
              {show ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {problem && <p className="signin__problem" role="alert">{problem}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>{busy ? "Checking…" : "Sign in"}</button>
      </form>
    </main>
  );
}
