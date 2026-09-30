import { useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";

export default function Composer({ onSend, speech, busy, placeholder = "Say or type where you're going", inline = false }) {
  const [text, setText] = useState("");
  const input = useRef(null);
  const submit = (value = text) => {
    if (!value.trim() || busy) return;
    onSend(value);
    setText("");
  };
  const mic = () => {
    const started = speech.listen((heard) => submit(heard));
    if (!started) input.current?.focus(); // iOS without speech recognition: use the keyboard's dictation key
  };
  return (
    <form className={`composer ${inline ? "composer--inline" : ""}`} onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <input
        ref={input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={speech.listening ? "Listening…" : placeholder}
        aria-label="Message"
        enterKeyHint="send"
        autoComplete="off"
      />
      <button type="button" className={`composer__mic ${speech.listening ? "is-listening" : ""}`} onClick={mic} aria-label="Speak">
        <Mic size={22} />
      </button>
      <button type="submit" className="composer__send" aria-label="Send" disabled={!text.trim() || busy}>
        <ArrowUp size={22} />
      </button>
    </form>
  );
}
