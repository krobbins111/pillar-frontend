import { useCallback, useState } from "react";

const Recognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeech() {
  const [listening, setListening] = useState(false);

  const speak = useCallback((text) => {
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    } catch { /* speech is a nicety, never a blocker */ }
  }, []);

  const listen = useCallback((onText) => {
    if (!Recognition) return false;
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
    return true;
  }, []);

  return { speak, listen, listening, canListen: Boolean(Recognition) };
}
