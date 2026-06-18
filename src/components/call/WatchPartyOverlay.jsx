import { useState, useRef, useEffect, useCallback } from 'react';
import { X, CheckCircle, Clock, Users, ChevronLeft } from 'lucide-react';
import socketService from '../../services/socket';

const C = {
  bg: '#0d0b1a',
  surface: 'rgba(255,255,255,0.05)',
  border: 'rgba(168,85,247,0.25)',
  accent: '#a855f7',
  accentGlow: 'rgba(168,85,247,0.35)',
  pink: '#ec4899',
  text: '#f0eaff',
  muted: 'rgba(240,234,255,0.5)',
  dim: 'rgba(240,234,255,0.28)',
  online: '#22d3a5',
};

const SERVICES = [
  { id: 'netflix',     name: 'Netflix',      color: '#E50914', label: 'N',  screen: true,  url: 'https://www.netflix.com'                         },
  { id: 'youtube',     name: 'YouTube',      color: '#FF0000', label: '▶',  screen: false, url: null                                              },
  { id: 'prime',       name: 'Prime Video',  color: '#00A8E1', label: '▶',  screen: true,  url: 'https://www.amazon.com/gp/video/storefront'      },
  { id: 'disney',      name: 'Disney+',      color: '#113CCF', label: '✦',  screen: true,  url: 'https://www.disneyplus.com'                      },
  { id: 'hulu',        name: 'Hulu',         color: '#1CE783', label: 'h',  screen: true,  url: 'https://www.hulu.com'                            },
  { id: 'max',         name: 'Max',          color: '#5A2BE2', label: 'M',  screen: true,  url: 'https://www.max.com'                             },
  { id: 'appletv',     name: 'Apple TV+',    color: '#d0d0d0', label: '⌘',  screen: true,  url: 'https://tv.apple.com'                            },
  { id: 'crunchyroll', name: 'Crunchyroll',  color: '#FF6B00', label: 'C',  screen: true,  url: 'https://www.crunchyroll.com'                     },
  { id: 'other',       name: 'Other',        color: '#a855f7', label: '⬡',  screen: true,  url: null                                              },
];

function watchRoomId(a, b) {
  return `watch_${[a, b].sort().join('_')}`;
}

function extractYouTubeId(input) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(13,11,26,0.92)',
      border: `1px solid ${C.border}`,
      borderRadius: 22,
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      boxShadow: `0 0 50px ${C.accentGlow}, 0 12px 40px rgba(0,0,0,0.7)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PulsingRing({ color = C.accent }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: color, opacity: 0.15, animation: 'wp-ring 2s ease-out infinite' }} />
      <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: color, opacity: 0.08, animation: 'wp-ring 2s ease-out 0.6s infinite' }} />
    </div>
  );
}

// ─── Service Picker ──────────────────────────────────────────────────────────

function ServicePicker({ onSelect, partnerName }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: '24px 20px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.surface, borderRadius: 10, padding: '5px 12px', marginBottom: 12 }}>
          <Users size={12} color={C.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Watch Together</span>
        </div>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>What are you watching?</p>
        <p style={{ margin: '5px 0 0', fontSize: 12, color: C.muted }}>
          {partnerName ? `You and ${partnerName} — pick a service` : 'Pick a streaming service'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {SERVICES.map(svc => (
          <button
            key={svc.id}
            onClick={() => onSelect(svc)}
            onMouseEnter={() => setHovered(svc.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '14px 8px', borderRadius: 16, cursor: 'pointer', border: 'none',
              background: hovered === svc.id ? `${svc.color}18` : C.surface,
              outline: hovered === svc.id ? `1.5px solid ${svc.color}88` : `1px solid rgba(255,255,255,0.07)`,
              transition: 'all 0.16s ease',
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: `linear-gradient(135deg, ${svc.color}33, ${svc.color}18)`,
              border: `1.5px solid ${svc.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: svc.label.length > 1 ? 18 : 22, fontWeight: 900, color: svc.color,
              boxShadow: hovered === svc.id ? `0 0 14px ${svc.color}44` : 'none',
              transition: 'box-shadow 0.16s',
            }}>
              {svc.label}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: hovered === svc.id ? C.text : C.muted, textAlign: 'center', lineHeight: 1.2 }}>
              {svc.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── YouTube URL Input ───────────────────────────────────────────────────────

function YouTubeInput({ onConfirm, onBack }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const id = extractYouTubeId(val.trim());
    if (!id) { setErr('Paste a YouTube URL or video ID'); return; }
    setErr('');
    onConfirm(id);
  };

  return (
    <div style={{ padding: '20px 24px 24px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0, marginBottom: 18 }}>
        <ChevronLeft size={15} /> Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF000022', border: '1px solid #FF000055', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#FF0000' }}>▶</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.text }}>YouTube</p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Frame-accurate sync</p>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <input
          type="text"
          value={val}
          onChange={e => { setVal(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="https://youtube.com/watch?v=..."
          autoFocus
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.surface, border: `1px solid ${err ? '#ef4444' : C.border}`,
            borderRadius: 12, padding: '12px 14px', color: C.text,
            fontSize: 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
        {err && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444' }}>{err}</p>}
        <button
          onClick={submit}
          style={{
            marginTop: 14, width: '100%', background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
            border: 'none', borderRadius: 12, padding: 13, color: '#fff',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: `0 4px 18px ${C.accentGlow}`,
          }}
        >
          Watch Together
        </button>
      </div>
    </div>
  );
}

// ─── Gate Overlay ────────────────────────────────────────────────────────────

function GateOverlay({ gateState, myUserId, onReady, partnerName, service }) {
  const iAmReady   = !!gateState[myUserId];
  const partnerReady = Object.entries(gateState).some(([id, v]) => id !== myUserId && v);
  const bothReady  = iAmReady && partnerReady;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,11,26,0.85)', backdropFilter: 'blur(14px)',
    }}>
      <div style={{ textAlign: 'center', padding: '0 28px', maxWidth: 310 }}>
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 22 }}>
          <PulsingRing color={bothReady ? C.online : C.accent} />
          <div style={{
            width: 60, height: 60, borderRadius: '50%', position: 'relative', zIndex: 1,
            background: bothReady ? `${C.online}33` : `${C.accent}33`,
            border: `2px solid ${bothReady ? C.online : C.accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {bothReady ? <CheckCircle size={26} color={C.online} /> : <Clock size={26} color={C.accent} />}
          </div>
        </div>

        <p style={{ margin: '0 0 5px', fontWeight: 700, fontSize: 19, color: C.text }}>
          {bothReady ? 'Starting now…' : `${service?.name ?? 'App'} opened in a new tab`}
        </p>
        <p style={{ margin: '0 0 22px', fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          {bothReady
            ? 'Both ready — enjoy!'
            : `Log in, find what you want to watch, pause at the opening scene, then tap Ready`}
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[{ label: 'You', ready: iAmReady }, { label: partnerName || 'Partner', ready: partnerReady }].map(({ label, ready }) => (
            <div key={label} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              background: ready ? `${C.online}18` : C.surface,
              border: `1px solid ${ready ? C.online : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: ready ? C.online : C.dim, boxShadow: ready ? `0 0 6px ${C.online}` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: ready ? C.online : C.muted }}>{label}</span>
            </div>
          ))}
        </div>

        {!iAmReady && (
          <button
            onClick={onReady}
            style={{
              width: '100%', padding: 14, borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: `0 4px 20px ${C.accentGlow}`,
            }}
          >
            I'm Ready
          </button>
        )}
        {iAmReady && !bothReady && (
          <div style={{ padding: 12, borderRadius: 12, background: `${C.accent}18`, border: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: 13, color: C.accent, fontWeight: 600 }}>
              Waiting for {partnerName || 'partner'}…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── YouTube Player ──────────────────────────────────────────────────────────

function YouTubePlayer({ videoId, roomId, myUserId, gateState, onReady, partnerName, onPause }) {
  const playerRef    = useRef(null);
  const isRemote     = useRef(false);
  const showGate     = Object.values(gateState).some(v => !v) || Object.keys(gateState).length < 2;

  useEffect(() => {
    const create = () => {
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player('wp-yt-player', {
        videoId,
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (isRemote.current) return;
            const socket = socketService.socket;
            if (!socket) return;
            const time = playerRef.current?.getCurrentTime?.() || 0;
            if (e.data === window.YT.PlayerState.PLAYING)      socket.emit('watch:play',  { room_id: roomId, time });
            else if (e.data === window.YT.PlayerState.PAUSED)  { socket.emit('watch:pause', { room_id: roomId, time }); onPause(); }
          },
        },
      });
    };
    if (window.YT?.Player) { create(); }
    else {
      window.__wpYTReady = create;
      if (!document.getElementById('wp-yt-api')) {
        const tag = document.createElement('script');
        tag.id = 'wp-yt-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => window.__wpYTReady?.();
      }
    }
    return () => { try { playerRef.current?.destroy?.(); } catch {} playerRef.current = null; };
  }, [videoId, roomId]);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const seek = (fn, { time }) => {
      isRemote.current = true;
      try { playerRef.current?.seekTo?.(time, true); fn?.(); }
      finally { isRemote.current = false; }
    };
    const onPlay   = d => seek(() => playerRef.current?.playVideo?.(),  d);
    const onPauseR = d => { seek(() => playerRef.current?.pauseVideo?.(), d); onPause(); };
    const onResume = d => seek(() => playerRef.current?.playVideo?.(),  d);
    socket.on('watch:play',        onPlay);
    socket.on('watch:force_pause', onPauseR);
    socket.on('watch:resume_all',  onResume);
    return () => {
      socket.off('watch:play',        onPlay);
      socket.off('watch:force_pause', onPauseR);
      socket.off('watch:resume_all',  onResume);
    };
  }, [onPause]);

  return (
    <div style={{ flex: 1, position: 'relative', background: '#000' }}>
      <div id="wp-yt-player" style={{ width: '100%', height: '100%' }} />
      {showGate && (
        <GateOverlay
          gateState={gateState} myUserId={myUserId}
          onReady={onReady} partnerName={partnerName}
          service={{ name: 'YouTube' }}
        />
      )}
    </div>
  );
}

// ─── Main Overlay ────────────────────────────────────────────────────────────

const WP_CSS = `
  @keyframes wp-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(2.4); opacity: 0; }
  }
`;

export default function WatchPartyOverlay({ isOpen, onClose, currentUserId, partnerId, partnerName, onStartScreenShare }) {
  const [service,    setService]    = useState(null);   // selected SERVICES entry
  const [videoId,    setVideoId]    = useState(null);   // YouTube video ID
  const [gateState,  setGateState]  = useState({});
  const [showGate,   setShowGate]   = useState(false);
  const roomId = watchRoomId(currentUserId, partnerId);

  // Join watch room + socket listeners
  useEffect(() => {
    if (!isOpen) return;
    const socket = socketService.socket;
    if (!socket) return;
    socket.emit('watch:join', { room_id: roomId, user_id: currentUserId, partner_id: partnerId });

    const onGateUpdate    = ({ gate }) => setGateState(gate);
    const onPartnerLeft   = () => { setService(null); setVideoId(null); setGateState({}); setShowGate(false); };
    const onServiceSelect = ({ service_id }) => {
      const svc = SERVICES.find(s => s.id === service_id);
      if (!svc) return;
      setService(svc);
      if (svc.screen) { onStartScreenShare?.(); setShowGate(true); }
    };
    const onYTStart = ({ video_id }) => {
      setVideoId(video_id);
      setService(SERVICES.find(s => s.id === 'youtube'));
      setGateState(g => ({ ...g, [partnerId]: false }));
    };
    const onResumeAll = () => setShowGate(false);

    socket.on('watch:gate_update',    onGateUpdate);
    socket.on('watch:partner_left',   onPartnerLeft);
    socket.on('watch:service_select', onServiceSelect);
    socket.on('watch:youtube_start',  onYTStart);
    socket.on('watch:resume_all',     onResumeAll);
    return () => {
      socket.off('watch:gate_update',    onGateUpdate);
      socket.off('watch:partner_left',   onPartnerLeft);
      socket.off('watch:service_select', onServiceSelect);
      socket.off('watch:youtube_start',  onYTStart);
      socket.off('watch:resume_all',     onResumeAll);
      socket.emit('watch:leave', { room_id: roomId, user_id: currentUserId });
    };
  }, [isOpen, roomId, currentUserId, partnerId]);

  const handleServiceSelect = useCallback((svc) => {
    const socket = socketService.socket;
    setService(svc);
    if (svc.id === 'youtube') return; // show URL input next, don't emit yet
    // Open the service in a new window so the user can log in
    if (svc.url) window.open(svc.url, '_blank', 'noopener');
    // Notify both users of the service choice + start screen share
    socket?.emit('watch:service_select', { room_id: roomId, user_id: currentUserId, service_id: svc.id });
    onStartScreenShare?.();
    setShowGate(true);
  }, [roomId, currentUserId, onStartScreenShare]);

  const handleYouTubeConfirm = useCallback((id) => {
    const socket = socketService.socket;
    socket?.emit('watch:youtube_start', { room_id: roomId, user_id: currentUserId, video_id: id });
    setVideoId(id);
    setGateState(g => ({ ...g, [currentUserId]: false }));
  }, [roomId, currentUserId]);

  const handleReady = useCallback(() => {
    const socket = socketService.socket;
    socket?.emit('watch:resume_request', { room_id: roomId, user_id: currentUserId, time: 0 });
  }, [roomId, currentUserId]);

  const handlePause = useCallback(() => {
    setShowGate(true);
    setGateState(g => ({ ...g, [currentUserId]: false }));
  }, [currentUserId]);

  if (!isOpen) return null;

  const isYouTubePlaying  = service?.id === 'youtube' && videoId;
  const isScreenShareMode = service && service.screen;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,3,12,0.78)', backdropFilter: 'blur(10px)',
    }}>
      <style>{WP_CSS}</style>

      {/* ── Full-screen YouTube player ── */}
      {isYouTubePlaying ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', background: 'rgba(13,11,26,0.92)', borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#FF0000' }}>▶</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>YouTube · Watching together</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.online, boxShadow: `0 0 6px ${C.online}`, marginLeft: 4 }} />
            </div>
            <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <X size={13} /> Close
            </button>
          </div>
          <YouTubePlayer
            videoId={videoId} roomId={roomId} myUserId={currentUserId}
            gateState={gateState} onReady={handleReady}
            partnerName={partnerName} onPause={handlePause}
          />
        </div>

      ) : (
        // ── Card UI ──
        <GlassCard style={{ width: '100%', maxWidth: 400, margin: '0 16px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', padding: 6, display: 'flex' }}>
            <X size={16} />
          </button>

          {/* Screen share active header */}
          {isScreenShareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${service.color}22`, border: `1px solid ${service.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: service.color }}>
                {service.label}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.text }}>{service.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Screen sharing active</p>
              </div>
              <button onClick={() => { setService(null); setShowGate(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                <ChevronLeft size={13} /> Change
              </button>
            </div>
          )}

          {/* Service picker */}
          {!service && <ServicePicker onSelect={handleServiceSelect} partnerName={partnerName} />}

          {/* YouTube URL input */}
          {service?.id === 'youtube' && !videoId && (
            <YouTubeInput onConfirm={handleYouTubeConfirm} onBack={() => setService(null)} />
          )}

          {/* Gate (screen share services + YouTube before video loads) */}
          {(isScreenShareMode || (service?.id === 'youtube' && videoId)) && showGate && (
            <div style={{ position: 'relative', minHeight: 320 }}>
              <GateOverlay
                gateState={gateState} myUserId={currentUserId}
                onReady={handleReady} partnerName={partnerName}
                service={service}
              />
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
