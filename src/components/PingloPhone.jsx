import { useState, useRef, useEffect } from "react";

const COLORS = {
  bg: "#0d0b1a",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  sent: "linear-gradient(135deg, #7c3aed, #a855f7)",
  received: "rgba(255,255,255,0.09)",
  accent: "#a855f7",
  accentSoft: "rgba(168,85,247,0.18)",
  online: "#22d3a5",
  text: "#f0eaff",
  muted: "rgba(240,234,255,0.45)",
  dim: "rgba(240,234,255,0.25)",
  unread: "linear-gradient(135deg, #ec4899, #a855f7)",
  inputBg: "rgba(255,255,255,0.06)",
};

const CONTACTS = [
  { id: 1, name: "Alex Rivera", preview: "Hey! Are you free tonight?", time: "5:30 AM", unread: 2, online: true, avatar: "AR", color: "#ec4899" },
  { id: 2, name: "Jordan Lee", preview: "I am fine. What about you?", time: "5:30 AM", unread: 0, online: true, avatar: "JL", color: "#7c3aed" },
  { id: 3, name: "Mia Chen", preview: "What is a spoof text message.", time: "5:30 AM", unread: 0, online: false, avatar: "MC", color: "#06b6d4" },
  { id: 4, name: "Dev Squad 🔥", preview: "What is Flash text message.", time: "5:30 AM", unread: 8, online: true, avatar: "DS", color: "#f59e0b", group: true },
  { id: 5, name: "Sam Torres", preview: "Hey! Yes we will talk later ab...", time: "5:30 AM", unread: 0, online: true, avatar: "ST", color: "#10b981" },
  { id: 6, name: "Priya Nair", preview: "Hey! How are you?", time: "5:30 AM", unread: 0, online: false, avatar: "PN", color: "#f472b6" },
  { id: 7, name: "Marcus Webb", preview: "No problem. Its fine.", time: "5:30 AM", unread: 1, online: true, avatar: "MW", color: "#818cf8" },
  { id: 8, name: "Casey Kim", preview: "Really...!!!", time: "5:30 AM", unread: 0, online: false, avatar: "CK", color: "#fb7185" },
];

const MESSAGES = [
  { id: 1, from: "them", text: "Hey, what are you building these days?", time: "9:41 AM" },
  { id: 2, from: "me", text: "Working on Pinglo — a real-time chat app 🚀", time: "9:42 AM" },
  { id: 3, from: "them", text: "Sounds fire. What stack?", time: "9:42 AM" },
  { id: 4, from: "me", text: "React + Flask + Socket.IO + MongoDB. Running it off my own PC 😤", time: "9:43 AM" },
  { id: 5, from: "them", text: "Self-hosted? That's actually sick 🔥", time: "9:44 AM" },
  { id: 6, from: "me", text: "CORS, gevent, Cloudflare tunnels... you know the drill lol", time: "9:44 AM" },
  { id: 7, from: "them", text: "Ha sounds like a journey. What's the UI?", time: "9:45 AM" },
  { id: 8, from: "me", text: "Dark glassmorphism. Purple + pink neon 💜", time: "9:45 AM" },
];

function Avatar({ contact, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${contact.color}cc, ${contact.color}55)`,
      border: `1.5px solid ${contact.color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: "#fff",
      flexShrink: 0, position: "relative",
      boxShadow: `0 0 10px ${contact.color}33`,
    }}>
      {contact.avatar}
      {contact.online && (
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.24, height: size * 0.24, borderRadius: "50%",
          background: COLORS.online, border: `2px solid ${COLORS.bg}`,
        }} />
      )}
    </div>
  );
}

function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 20px 4px", background: COLORS.bg,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{time}</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {/* Signal */}
        <svg width="14" height="10" viewBox="0 0 14 10" fill={COLORS.text}>
          <rect x="0" y="6" width="2" height="4" rx="0.5" opacity="0.4"/>
          <rect x="3" y="4" width="2" height="6" rx="0.5" opacity="0.6"/>
          <rect x="6" y="2" width="2" height="8" rx="0.5" opacity="0.8"/>
          <rect x="9" y="0" width="2" height="10" rx="0.5"/>
        </svg>
        {/* Wifi */}
        <svg width="14" height="10" viewBox="0 0 16 12" fill="none" stroke={COLORS.text} strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 4.5C3.8 1.8 7 0.5 8 0.5s4.2 1.3 7 4" opacity="0.4"/>
          <path d="M3.5 7C5.2 5 6.6 4 8 4s2.8 1 4.5 3" opacity="0.7"/>
          <path d="M6 9.5C6.8 8.5 7.4 8 8 8s1.2.5 2 1.5"/>
          <circle cx="8" cy="11.5" r="0.8" fill={COLORS.text} stroke="none"/>
        </svg>
        {/* Battery */}
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <div style={{ width: 20, height: 10, borderRadius: 2.5, border: `1.5px solid ${COLORS.text}`, padding: 1.5, display: "flex", alignItems: "center" }}>
            <div style={{ width: "80%", height: "100%", background: COLORS.text, borderRadius: 1 }} />
          </div>
          <div style={{ width: 2, height: 5, background: COLORS.text, borderRadius: "0 1px 1px 0", opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}

function InboxScreen({ onSelect }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const tabs = ["All", "Unread", "Groups"];

  const filtered = CONTACTS.filter(c => {
    const m = c.name.toLowerCase().includes(search.toLowerCase());
    if (tab === "Unread") return m && c.unread > 0;
    if (tab === "Groups") return m && c.group;
    return m;
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bg, overflow: "hidden" }}>
      <StatusBar />

      {/* Header */}
      <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 14px rgba(168,85,247,0.5)",
          }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>Pinglo</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "8px 12px" }}>
          <svg width="12" height="12" fill="none" stroke={COLORS.dim} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
            style={{ background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 12, flex: 1 }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, padding: "10px 16px 0" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            background: tab === t ? "linear-gradient(135deg, #7c3aed, #a855f7)" : COLORS.surface,
            color: tab === t ? "#fff" : COLORS.muted,
            boxShadow: tab === t ? "0 0 10px rgba(168,85,247,0.4)" : "none",
          }}>{t}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {filtered.map(c => (
          <div key={c.id} onClick={() => onSelect(c)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 8px",
            borderRadius: 12, cursor: "pointer", marginBottom: 1,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Avatar contact={c} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                <span style={{ fontSize: 10, color: COLORS.dim }}>{c.time}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 155 }}>{c.preview}</span>
                {c.unread > 0 && (
                  <span style={{ background: COLORS.unread, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, flexShrink: 0 }}>{c.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 0 22px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
        {[
          { icon: "chat", label: "Chat", active: true },
          { icon: "call", label: "Call" },
          { icon: "feeds", label: "Feeds" },
          { icon: "contacts", label: "Contacts" },
          { icon: "profile", label: "Profile" },
        ].map(({ icon, label, active }) => (
          <button key={icon} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? COLORS.accent : COLORS.dim }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: active ? COLORS.accentSoft : "transparent" }}>
              {icon === "chat" && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              {icon === "call" && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              {icon === "feeds" && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h10"/></svg>}
              {icon === "contacts" && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              {icon === "profile" && <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            </div>
            <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ contact, onBack }) {
  const [messages, setMessages] = useState(MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => [...m, { id: Date.now(), from: "me", text: input, time }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, from: "them", text: "That's cool! Tell me more 🔥", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 1000);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bg, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: 80, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)", pointerEvents: "none" }}/>

      <StatusBar />

      {/* Chat header */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 14px 10px", borderBottom: `1px solid ${COLORS.border}`, backdropFilter: "blur(20px)", background: "rgba(13,11,26,0.9)", position: "relative", zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, marginRight: 8, padding: 0, display: "flex" }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <Avatar contact={contact} size={36} />
        <div style={{ flex: 1, marginLeft: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{contact.name}</div>
          <div style={{ fontSize: 10, color: contact.online ? COLORS.online : COLORS.dim }}>{contact.online ? "● Active now" : "Last seen recently"}</div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 10 5-3v10l-5-3V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"/></svg>,
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
          ].map((svg, i) => (
            <button key={i} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted }}>{svg}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        {messages.map((msg, i) => {
          const isMe = msg.from === "me";
          const prevSame = i > 0 && messages[i - 1].from === msg.from;
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: prevSame ? 2 : 10 }}>
              {!isMe && !prevSame && <Avatar contact={contact} size={24} />}
              {!isMe && prevSame && <div style={{ width: 24 }} />}
              <div style={{ maxWidth: "72%", marginLeft: isMe ? 0 : 6 }}>
                <div style={{
                  padding: "8px 12px",
                  borderRadius: isMe ? "15px 15px 3px 15px" : "15px 15px 15px 3px",
                  background: isMe ? COLORS.sent : COLORS.received,
                  color: COLORS.text, fontSize: 12.5, lineHeight: 1.5,
                  border: isMe ? "none" : `1px solid ${COLORS.border}`,
                  boxShadow: isMe ? "0 3px 12px rgba(124,58,237,0.35)" : "none",
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 2, textAlign: isMe ? "right" : "left", paddingRight: isMe ? 3 : 0, paddingLeft: isMe ? 0 : 3 }}>
                  {msg.time}{isMe && " ✓✓"}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px 22px", borderTop: `1px solid ${COLORS.border}`, background: "rgba(13,11,26,0.95)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 22, padding: "8px 13px" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.dim, display: "flex", padding: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: COLORS.text, fontSize: 13 }} />
            <button style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.dim, display: "flex", padding: 0 }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            </button>
          </div>
          <button onClick={send} style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #ec4899)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(168,85,247,0.5)", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0612 0%, #120820 50%, #0d0b1a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 0",
    }}>
      {/* Ambient glows behind phone */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }}/>
      <div style={{ position: "fixed", bottom: "20%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", pointerEvents: "none" }}/>

      {/* Phone shell */}
      <div style={{
        width: 375, height: 812,
        borderRadius: 50,
        background: "#111",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 0 0 10px #1a1a1a, 0 0 0 11px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(168,85,247,0.15)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Screen bezel inner */}
        <div style={{ position: "absolute", inset: 2, borderRadius: 48, overflow: "hidden", background: COLORS.bg, display: "flex", flexDirection: "column" }}>
          {children}
        </div>

        {/* Dynamic island */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          width: 120, height: 34, borderRadius: 20,
          background: "#000",
          zIndex: 100,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 16px",
        }}>
          {/* Camera */}
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 0 3px rgba(0,0,0,0.8)" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#2a2a2a", margin: "3px auto" }} />
          </div>
          {/* FaceID sensor */}
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(100,80,200,0.4)", boxShadow: "0 0 4px rgba(124,58,237,0.5)" }} />
        </div>

        {/* Side buttons */}
        <div style={{ position: "absolute", left: -3, top: 120, width: 3, height: 32, background: "#222", borderRadius: "2px 0 0 2px" }}/>
        <div style={{ position: "absolute", left: -3, top: 165, width: 3, height: 56, background: "#222", borderRadius: "2px 0 0 2px" }}/>
        <div style={{ position: "absolute", left: -3, top: 232, width: 3, height: 56, background: "#222", borderRadius: "2px 0 0 2px" }}/>
        <div style={{ position: "absolute", right: -3, top: 160, width: 3, height: 80, background: "#222", borderRadius: "0 2px 2px 0" }}/>

        {/* Home indicator */}
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 120, height: 4, borderRadius: 3, background: "rgba(255,255,255,0.25)", zIndex: 100 }}/>
      </div>
    </div>
  );
}

export default function PingloPhone() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 4px; }
        button { font-family: 'DM Sans', sans-serif; }
        input { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <PhoneFrame>
        {selected
          ? <ChatScreen contact={selected} onBack={() => setSelected(null)} />
          : <InboxScreen onSelect={setSelected} />
        }
      </PhoneFrame>
    </>
  );
}
