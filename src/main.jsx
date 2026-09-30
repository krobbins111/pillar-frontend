import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/700.css";
import "@fontsource/doto/900.css"; // LED signs
import App from "./App.jsx";
import SignIn from "./components/SignIn.jsx";
import { signOut, token } from "./lib/session";
import "./theme.css";

// /?signout forgets this browser's sign-in (for handing a tablet to someone else).
if (new URLSearchParams(window.location.search).has("signout")) {
  signOut();
  window.history.replaceState(null, "", window.location.pathname);
}

// The app only loads once someone has signed in on this browser; a rejected token brings the sign-in page back.
function Gate() {
  const [signedIn, setSignedIn] = useState(Boolean(token()));
  useEffect(() => {
    const out = () => setSignedIn(false);
    window.addEventListener("pillar-signout", out);
    return () => window.removeEventListener("pillar-signout", out);
  }, []);
  return signedIn ? <App /> : <SignIn onSignedIn={() => setSignedIn(true)} />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Gate />
  </React.StrictMode>,
);
