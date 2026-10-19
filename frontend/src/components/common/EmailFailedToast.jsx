import React, { useEffect, useState } from "react";

// Shows a red warning when the server tells us an email could not be delivered.
const EmailFailedToast = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onFail = (e) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list, { id, text: e.detail?.message || "An email could not be delivered." }]);
      setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 10000);
    };
    window.addEventListener("emailFailed", onFail);
    return () => window.removeEventListener("emailFailed", onFail);
  }, []);

  if (!items.length) return null;

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {items.map((i) => (
        <div key={i.id} style={{ background: "#dc2626", color: "#fff", padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.25)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ flex: 1 }}>⚠ {i.text}</span>
          <button onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))} style={{ background: "none", border: 0, color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
};

export default EmailFailedToast;
