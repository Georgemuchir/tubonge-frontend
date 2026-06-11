import { useState, useRef } from "react";

const conversations = [
  { id:1, name:"George muchiri", lastMessage:"Photo", type:"photo", time:"5/30/26", unread:6, online:true },
  { id:2, name:"Alex Rivera", lastMessage:"Sounds good, see you then 👍", type:"text", time:"Yesterday", unread:0, online:false },
  { id:3, name:"Zara M.", lastMessage:"Can you send the files?", type:"text", time:"Mon", unread:2, online:true },
];

const feedPosts = [
  { id:1, user:"Lena Park", handle:"@lenapark", time:"2m ago", content:"Just shipped a new feature for real-time presence indicators 🚀 love when everything clicks into place", likes:42, comments:8, shares:3, tag:"Tech" },
  { id:2, user:"Dev Weekly", handle:"@devweekly", time:"18m ago", content:"WebSockets vs SSE vs Long Polling — which one should you actually use in 2026? We broke it down thread 🧵", likes:189, comments:34, shares:61, tag:"News" },
  { id:3, user:"Marcus T.", handle:"@marcust", time:"1h ago", content:"Reminder that dark mode isn't just an aesthetic choice — it's an accessibility feature for millions of users 🖤", likes:310, comments:22, shares:14, tag:"Design" },
  { id:4, user:"Pinglo Updates", handle:"@pinglo", time:"3h ago", content:"🎉 New: Voice messages now support waveform playback. Tap and hold the mic to record. Available now.", likes:521, comments:67, shares:90, tag:"Update", official:true },
];

const tagColors = { Tech:["rgba(99,102,241,0.15)","#818cf8"], News:["rgba(236,72,153,0.12)","#f472b6"], Design:["rgba(20,184,166,0.12)","#2dd4bf"], Update:["rgba(168,85,247,0.15)","#c084fc"] };

// ── ICONS ──
const CameraIcon = ({ size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const SearchIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const HeartIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CommentIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ShareIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogOutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;

// ── SHARED AVATAR ──
function ProfileAvatar({ profilePic, size=42, fontSize=14, onClick }) {
  return (
    <div onClick={onClick} style={{ position:"relative", cursor: onClick?"pointer":"default", flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#a855f7,#ec4899)", border:"2px solid rgba(168,85,247,0.45)", display:"flex", alignItems:"center", justifyContent:"center", fontSize, fontWeight:800, color:"#fff", letterSpacing:"0.04em", userSelect:"none", overflow:"hidden" }}>
        {profilePic
          ? <img src={profilePic} alt="profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : "GM"}
      </div>
      <div style={{ position:"absolute", bottom:1, right:1, width: size>50?13:11, height: size>50?13:11, borderRadius:"50%", background:"#22c55e", border:"2px solid #0a0a12" }} />
    </div>
  );
}

function ConvoAvatar({ name, online, size=48 }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = [["#a855f7","#ec4899"],["#8b5cf6","#f472b6"],["#7c3aed","#db2777"]];
  const [g1,g2] = colors[name.length % colors.length];
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${g1},${g2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.33, fontWeight:700, color:"#fff", boxShadow:"0 0 0 2px rgba(168,85,247,0.12)" }}>{initials}</div>
      {online && <div style={{ position:"absolute", bottom:2, right:2, width:11, height:11, borderRadius:"50%", background:"#22c55e", border:"2px solid #0a0a12" }} />}
    </div>
  );
}

function FeedAvatar({ name, official }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:40, height:40, borderRadius:"50%", background: official?"linear-gradient(135deg,#9333ea,#ec4899)":"linear-gradient(135deg,#334155,#1e293b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, border: official?"2px solid rgba(168,85,247,0.5)":"2px solid rgba(255,255,255,0.06)" }}>
      {initials}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:48, height:27, borderRadius:14, background: on?"linear-gradient(135deg,#9333ea,#ec4899)":"rgba(255,255,255,0.1)", cursor:"pointer", position:"relative", transition:"background 0.25s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left: on?24:3, width:21, height:21, borderRadius:"50%", background:"#fff", transition:"left 0.25s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", padding:"20px 4px 8px" }}>{children}</div>;
}

function SettingsRow({ icon, label, value, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, marginBottom:8 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(168,85,247,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#a78bfa", flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{label}</div>
        {value && <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>{value}</div>}
      </div>
      {children}
    </div>
  );
}

// ── SETTINGS ──
function SettingsView({ profilePic, setProfilePic }) {
  const [showLast, setShowLast] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState("@muchiri");
  const [draft, setDraft] = useState("");
  const fileRef = useRef();

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfilePic(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ padding:"16px 16px 100px", overflowY:"auto" }}>

      {/* Profile card */}
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 16px", background:"rgba(168,85,247,0.07)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:18, marginBottom:4 }}>
        {/* Avatar with camera overlay */}
        <div style={{ position:"relative", cursor:"pointer" }} onClick={() => fileRef.current.click()}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#a855f7,#ec4899)", border:"2px solid rgba(168,85,247,0.45)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", overflow:"hidden" }}>
            {profilePic
              ? <img src={profilePic} alt="profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : "GM"}
          </div>
          {/* Camera badge */}
          <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,#9333ea,#ec4899)", border:"2px solid #0a0a12", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
            <CameraIcon size={11} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:"none" }} />
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:17, color:"#f1f5f9" }}>George Muchiri</div>
          <div style={{ fontSize:13, color:"#a78bfa", marginTop:2 }}>{username}</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>
            Tap photo to change
          </div>
        </div>

        {profilePic && (
          <button onClick={() => setProfilePic(null)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#f87171", cursor:"pointer" }}>
            <TrashIcon />
          </button>
        )}
      </div>

      {/* USERNAME */}
      <SectionLabel>Username</SectionLabel>
      <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, marginBottom:8 }}>
        {editingUsername ? (
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} placeholder={username} style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(168,85,247,0.4)", borderRadius:8, padding:"8px 12px", color:"#f1f5f9", fontSize:14, outline:"none" }} />
            <button onClick={()=>{ if(draft.trim()) setUsername(draft.trim().startsWith("@")?draft.trim():"@"+draft.trim()); setEditingUsername(false); setDraft(""); }} style={{ background:"linear-gradient(135deg,#9333ea,#ec4899)", border:"none", borderRadius:8, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Save</button>
            <button onClick={()=>{ setEditingUsername(false); setDraft(""); }} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:8, padding:"8px 12px", color:"#64748b", fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:15, fontWeight:600, color:"#e2e8f0" }}>{username}</span>
            <button onClick={()=>{ setEditingUsername(true); setDraft(username); }} style={{ background:"none", border:"none", color:"#a78bfa", fontSize:13, fontWeight:600, cursor:"pointer" }}>Edit</button>
          </div>
        )}
      </div>

      {/* PRIVACY */}
      <SectionLabel>Privacy</SectionLabel>
      <SettingsRow icon={<LockIcon />} label="Show last seen"><Toggle on={showLast} onToggle={()=>setShowLast(v=>!v)} /></SettingsRow>
      <SettingsRow icon={<UserIcon />} label="Read receipts"><Toggle on={readReceipts} onToggle={()=>setReadReceipts(v=>!v)} /></SettingsRow>

      {/* NOTIFICATIONS */}
      <SectionLabel>Notifications</SectionLabel>
      <SettingsRow icon={<BellIcon />} label="Push notifications"><Toggle on={notifications} onToggle={()=>setNotifications(v=>!v)} /></SettingsRow>

      {/* THEME */}
      <SectionLabel>Theme</SectionLabel>
      <div style={{ display:"flex", gap:10, marginBottom:8 }}>
        {[["dark","🌙","Dark"],["light","☀️","Light"]].map(([val,emoji,label]) => (
          <button key={val} onClick={()=>setTheme(val)} style={{ flex:1, padding:"12px 0", borderRadius:14, border: theme===val?"1px solid rgba(168,85,247,0.5)":"1px solid rgba(255,255,255,0.07)", background: theme===val?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.03)", color: theme===val?"#c084fc":"#475569", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>{emoji}</span>{label}
          </button>
        ))}
      </div>

      {/* ACCOUNT */}
      <SectionLabel>Account</SectionLabel>
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:14, cursor:"pointer" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"rgba(239,68,68,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#f87171" }}><LogOutIcon /></div>
        <span style={{ fontSize:14, fontWeight:600, color:"#f87171" }}>Sign Out</span>
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function PingloApp() {
  const [navTab, setNavTab] = useState("chat");
  const [msgTab, setMsgTab] = useState("All");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState({});
  const [profilePic, setProfilePic] = useState(null); // shared across header + settings

  const filtered = conversations.filter(c => {
    if (msgTab==="Unread" && c.unread===0) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const navItems = [
    { id:"chat", icon:"💬" },
    { id:"calls", icon:"📞" },
    { id:"feed", icon:"📰" },
    { id:"settings", icon:"⚙️" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a12", fontFamily:"'Inter',-apple-system,sans-serif", color:"#e2e8f0", maxWidth:430, margin:"0 auto", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-80, right:-60, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:120, left:-80, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)", pointerEvents:"none" }} />

      {/* HEADER */}
      <div style={{ padding:"52px 20px 16px", background:"rgba(255,255,255,0.025)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(168,85,247,0.12)", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Tapping avatar goes to settings */}
            <ProfileAvatar
              profilePic={profilePic}
              size={42}
              onClick={() => setNavTab("settings")}
            />
            <div>
              <div style={{ fontWeight:700, fontSize:16, letterSpacing:"-0.02em", lineHeight:1.2 }}>@mello 💙</div>
              <div style={{ fontSize:11, color:"#a78bfa", fontWeight:500 }}>1 active chat</div>
            </div>
          </div>
          <button style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", color:"#c084fc", cursor:"pointer" }}>
            <EditIcon />
          </button>
        </div>

        {navTab==="chat" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"10px 14px", marginBottom:14 }}>
            <span style={{ color:"#64748b" }}><SearchIcon /></span>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search conversations..." style={{ background:"none", border:"none", outline:"none", color:"#e2e8f0", fontSize:14, flex:1 }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {["All","Unread"].map(t => (
              <button key={t} onClick={()=>setMsgTab(t)} style={{ padding:"6px 18px", borderRadius:20, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s", background:msgTab===t?"linear-gradient(135deg,#9333ea,#ec4899)":"rgba(255,255,255,0.06)", color:msgTab===t?"#fff":"#64748b", boxShadow:msgTab===t?"0 4px 12px rgba(147,51,234,0.15)":"none" }}>{t}</button>
            ))}
          </div>
        </>}

        {navTab==="feed" && (
          <div style={{ display:"flex", gap:8 }}>
            {["For You","Following","Trending"].map((t,i) => (
              <button key={t} style={{ padding:"6px 14px", borderRadius:20, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", background:i===0?"linear-gradient(135deg,#9333ea,#ec4899)":"rgba(255,255,255,0.06)", color:i===0?"#fff":"#64748b" }}>{t}</button>
            ))}
          </div>
        )}

        {navTab==="settings" && (
          <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.02em", color:"#f1f5f9" }}>Settings</div>
        )}
      </div>

      {/* CHAT */}
      {navTab==="chat" && (
        <div style={{ padding:"10px 12px", paddingBottom:90 }}>
          {filtered.length===0 && <div style={{ textAlign:"center", color:"#475569", marginTop:60, fontSize:14 }}>No conversations found</div>}
          {filtered.map((c,i) => (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 12px", borderRadius:16, marginBottom:4, cursor:"pointer", background:i===0?"rgba(168,85,247,0.07)":"transparent", border:i===0?"1px solid rgba(168,85,247,0.12)":"1px solid transparent" }}>
              <ConvoAvatar name={c.name} online={c.online} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontWeight:c.unread>0?700:500, fontSize:15, color:c.unread>0?"#f1f5f9":"#94a3b8", letterSpacing:"-0.01em" }}>{c.name}</span>
                  <span style={{ fontSize:11, color:"#475569", flexShrink:0 }}>{c.time}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:13 }}>
                  {c.type==="photo" && <span style={{ color:"#a78bfa" }}><CameraIcon /></span>}
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:c.unread>0?"#94a3b8":"#475569" }}>{c.lastMessage}</span>
                </div>
              </div>
              {c.unread>0 && <div style={{ background:"linear-gradient(135deg,#9333ea,#ec4899)", color:"#fff", borderRadius:20, minWidth:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, padding:"0 6px", boxShadow:"0 2px 8px rgba(147,51,234,0.2)", flexShrink:0 }}>{c.unread}</div>}
            </div>
          ))}
        </div>
      )}

      {/* FEED */}
      {navTab==="feed" && (
        <div style={{ padding:"12px 14px", paddingBottom:90 }}>
          {feedPosts.map(post => {
            const [tagBg,tagColor] = tagColors[post.tag]||["rgba(255,255,255,0.08)","#94a3b8"];
            const isLiked = liked[post.id];
            return (
              <div key={post.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <FeedAvatar name={post.user} official={post.official} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontWeight:700, fontSize:14, color:"#f1f5f9" }}>{post.user}</span>
                      {post.official && <span style={{ fontSize:10, background:"linear-gradient(135deg,#9333ea,#ec4899)", color:"#fff", borderRadius:6, padding:"1px 6px", fontWeight:600 }}>official</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:1 }}>
                      <span style={{ fontSize:11, color:"#475569" }}>{post.handle}</span>
                      <span style={{ fontSize:11, color:"#334155" }}>·</span>
                      <span style={{ fontSize:11, color:"#475569" }}>{post.time}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, background:tagBg, color:tagColor, borderRadius:8, padding:"3px 8px" }}>{post.tag}</span>
                </div>
                <p style={{ fontSize:14, color:"#cbd5e1", lineHeight:1.55, margin:"0 0 12px" }}>{post.content}</p>
                <div style={{ display:"flex", alignItems:"center", gap:20, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:10 }}>
                  <button onClick={()=>setLiked(l=>({...l,[post.id]:!l[post.id]}))} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:isLiked?"#ec4899":"#475569", fontSize:12, fontWeight:600, padding:0 }}><HeartIcon />{post.likes+(isLiked?1:0)}</button>
                  <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#475569", fontSize:12, fontWeight:600, padding:0 }}><CommentIcon />{post.comments}</button>
                  <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#475569", fontSize:12, fontWeight:600, padding:0 }}><ShareIcon />{post.shares}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CALLS */}
      {navTab==="calls" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, color:"#334155", fontSize:14 }}>
          📞 Calls coming soon
        </div>
      )}

      {/* SETTINGS */}
      {navTab==="settings" && <SettingsView profilePic={profilePic} setProfilePic={setProfilePic} />}

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"10px 32px 24px", background:"rgba(10,10,18,0.9)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(168,85,247,0.1)", display:"flex", justifyContent:"space-around", zIndex:10 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={()=>setNavTab(item.id)} style={{ background:navTab===item.id?"rgba(168,85,247,0.18)":"transparent", border:"none", borderRadius:12, width:48, height:44, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s" }}>
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
