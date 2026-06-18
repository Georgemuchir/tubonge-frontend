import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, Youtube, Monitor, CheckCircle, Clock, Users } from 'lucide-react';
import socketService from '../../services/socket';

const C = {
  bg: '#0d0b1a',
  surface: 'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.09)',
  border: 'rgba(168,85,247,0.25)',
  accent: '#a855f7',
  accentGlow: 'rgba(168,85,247,0.35)',
  pink: '#ec4899',
  pinkGlow: 'rgba(236,72,153,0.35)',
  text: '#f0eaff',
  muted: 'rgba(240,234,255,0.5)',
  dim: 'rgba(240,234,255,0.28)',
  online: '#22d3a5',
};

// Derive a stable room ID from two user IDs (order-independent)
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
      background: 'rgba(13,11,26,0.88)',
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: `0 0 40px ${C.accentGlow}, 0 8px 32px rgba(0,0,0,0.6)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function PulsingRing({ color = C.accent }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: -8, borderRadius: '50%',
        background: color, opacity: 0.15,
        animation: 'wp-ring 2s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: -16, borderRadius: '50%',
        background: color, opacity: 0.08,
        animation: 'wp-ring 2s ease-out 0.6s infinite',
      }} />
    </div>
  );
}

// ─── Mode Picker ────────────────────────────────────────────────────────────

function ModePicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  const modes = [
    {
      id: 'youtube',
      icon: Youtube,
      label: 'YouTube',
      sub: 'Frame-accurate sync',
      color: '#ff4444',
    },
    {
      id: 'screenshare',
      icon: Monitor,
      label: 'Screen Share',
      sub: 'Netflix / any stream',
      color: C.accent,
    },
  ];

  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.surface, borderRadius: 12, padding: '6px 14px',
          marginBottom: 16,
        }}>
          <Users size={13} color={C.accent} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Watch Together
          </span>
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>
          What are you watching?
        </p>
        <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>
          Either of you can pause — both have to resume
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, width: '100%' }}>
        {modes.map(({ id, icon: Icon, label, sub, color }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 10, padding: '20px 12px', borderRadius: 16, cursor: 'pointer', border: 'none',
              background: hovered === id
                ? `rgba(${id === 'youtube' ? '255,68,68' : '168,85,247'},0.12)`
                : C.surface,
              outline: hovered === id ? `1.5px solid ${color}` : `1px solid ${C.border}`,
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${color}22, ${color}44)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${color}44`,
            }}>
              <Icon size={24} color={color} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: C.text }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── YouTube URL Input ───────────────────────────────────────────────────────

function YouTubeInput({ onConfirm }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const id = extractYouTubeId(val.trim());
    if (!id) { setErr('Paste a YouTube URL or video ID'); return; }
    setErr('');
    onConfirm(id);
  };

  return (
    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 18, color: C.text }}>
          YouTube URL
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
          Paste the link — both of you get the same player
        </p>
      </div>
      <div>
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
        {err && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>{err}</p>}
      </div>
      <button
        onClick={submit}
        style={{
          background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
          border: 'none', borderRadius: 12, padding: '13px', color: '#fff',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%',
          boxShadow: `0 4px 18px ${C.accentGlow}`,
        }}
      >
        Start Watching Together
      </button>
    </div>
  );
}

// ─── Gate Overlay (blocks play until both confirm) ───────────────────────────

function GateOverlay({ gateState, myUserId, onReady, partnerName, mode }) {
  const iAmReady = gateState[myUserId];
  const partnerReady = Object.entries(gateState).some(([id, v]) => id !== myUserId && v);
  const bothReady = iAmReady && partnerReady;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,11,26,0.82)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 300 }}>
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 24 }}>
          <PulsingRing color={bothReady ? C.online : C.accent} />
          <div style={{
            width: 64, height: 64, borderRadius: '50%', position: 'relative', zIndex: 1,
            background: bothReady
              ? `linear-gradient(135deg, ${C.online}44, ${C.online}22)`
              : `linear-gradient(135deg, ${C.accent}44, ${C.pink}22)`,
            border: `2px solid ${bothReady ? C.online : C.accent}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {bothReady
              ? <CheckCircle size={28} color={C.online} />
              : <Clock size={28} color={C.accent} />}
          </div>
        </div>

        <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 20, color: C.text }}>
          {bothReady ? 'Starting now…' : 'Waiting for both of you'}
        </p>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          {mode === 'youtube'
            ? 'Both tap Ready and the video plays together'
            : `Share your screen, then tap Ready. ${partnerName || 'Your partner'} will see when you're set.`}
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'You', ready: iAmReady },
            { label: partnerName || 'Partner', ready: partnerReady },
          ].map(({ label, ready }) => (
            <div key={label} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              background: ready ? `${C.online}18` : C.surface,
              border: `1px solid ${ready ? C.online : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: ready ? C.online : C.dim,
                boxShadow: ready ? `0 0 6px ${C.online}` : 'none',
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: ready ? C.online : C.muted }}>{label}</span>
            </div>
          ))}
        </div>

        {!iAmReady && (
          <button
            onClick={onReady}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
              color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: `0 4px 20px ${C.accentGlow}`,
            }}
          >
            I'm Ready
          </button>
        )}
        {iAmReady && !bothReady && (
          <div style={{
            padding: '12px', borderRadius: 12,
            background: `${C.accent}18`, border: `1px solid ${C.border}`,
          }}>
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
  const playerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const showGate = Object.values(gateState).some(v => !v) || Object.keys(gateState).length < 2;

  useEffect(() => {
    const loadAndCreate = () => {
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player('wp-yt-player', {
        videoId,
        playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (isRemoteAction.current) return;
            const socket = socketService.socket;
            if (!socket) return;
            const time = playerRef.current?.getCurrentTime?.() || 0;
            if (e.data === window.YT.PlayerState.PLAYING) {
              socket.emit('watch:play', { room_id: roomId, time });
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              socket.emit('watch:pause', { room_id: roomId, time });
              onPause();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadAndCreate();
    } else {
      window.__wpYTReady = loadAndCreate;
      if (!document.getElementById('wp-yt-api')) {
        const tag = document.createElement('script');
        tag.id = 'wp-yt-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => window.__wpYTReady?.();
      }
    }

    return () => {
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, roomId]);

  // Socket listeners for remote player control
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handlePlay = ({ time }) => {
      isRemoteAction.current = true;
      try {
        playerRef.current?.seekTo?.(time, true);
        playerRef.current?.playVideo?.();
      } finally { isRemoteAction.current = false; }
    };
    const handlePause = ({ time }) => {
      isRemoteAction.current = true;
      try {
        playerRef.current?.seekTo?.(time, true);
        playerRef.current?.pauseVideo?.();
      } finally { isRemoteAction.current = false; }
      onPause();
    };
    const handleResume = ({ time }) => {
      isRemoteAction.current = true;
      try {
        playerRef.current?.seekTo?.(time, true);
        playerRef.current?.playVideo?.();
      } finally { isRemoteAction.current = false; }
    };

    socket.on('watch:play',       handlePlay);
    socket.on('watch:force_pause', handlePause);
    socket.on('watch:resume_all', handleResume);
    return () => {
      socket.off('watch:play',       handlePlay);
      socket.off('watch:force_pause', handlePause);
      socket.off('watch:resume_all', handleResume);
    };
  }, [onPause]);

  return (
    <div style={{ flex: 1, position: 'relative', background: '#000' }}>
      <div id="wp-yt-player" style={{ width: '100%', height: '100%' }} />
      {showGate && (
        <GateOverlay
          gateState={gateState}
          myUserId={myUserId}
          onReady={onReady}
          partnerName={partnerName}
          mode="youtube"
        />
      )}
    </div>
  );
}

// ─── Screen Share Gate ───────────────────────────────────────────────────────

function ScreenShareGate({ gateState, myUserId, onReady, partnerName }) {
  return (
    <div style={{
      flex: 1, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, minHeight: 280,
    }}>
      <GateOverlay
        gateState={gateState}
        myUserId={myUserId}
        onReady={onReady}
        partnerName={partnerName}
        mode="screenshare"
      />
      <div style={{ textAlign: 'center', opacity: 0.25, userSelect: 'none' }}>
        <Monitor size={64} color={C.accent} />
        <p style={{ margin: '12px 0 0', color: C.muted, fontSize: 14 }}>Screen share active</p>
      </div>
    </div>
  );
}

// ─── Main Overlay ────────────────────────────────────────────────────────────

const WP_CSS = `
  @keyframes wp-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }
`;

export default function WatchPartyOverlay({ isOpen, onClose, currentUserId, partnerId, partnerName, onStartScreenShare }) {
  const [mode, setMode] = useState(null);           // null | 'youtube' | 'screenshare'
  const [videoId, setVideoId] = useState(null);
  const [gateState, setGateState] = useState({});   // { userId: bool }
  const [awaitingGate, setAwaitingGate] = useState(false);
  const roomId = watchRoomId(currentUserId, partnerId);

  // Join watch socket room when overlay opens
  useEffect(() => {
    if (!isOpen) return;
    const socket = socketService.socket;
    if (!socket) return;
    socket.emit('watch:join', { room_id: roomId, user_id: currentUserId, partner_id: partnerId });

    const handleGateUpdate = ({ gate }) => setGateState(gate);
    const handlePartnerLeft = () => { setMode(null); setVideoId(null); setGateState({}); };

    socket.on('watch:gate_update',  handleGateUpdate);
    socket.on('watch:partner_left', handlePartnerLeft);
    return () => {
      socket.off('watch:gate_update',  handleGateUpdate);
      socket.off('watch:partner_left', handlePartnerLeft);
      socket.emit('watch:leave', { room_id: roomId, user_id: currentUserId });
    };
  }, [isOpen, roomId, currentUserId, partnerId]);

  const handleReady = useCallback(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const time = 0; // could pass current player time for YouTube
    socket.emit('watch:resume_request', { room_id: roomId, user_id: currentUserId, time });
  }, [roomId, currentUserId]);

  const handlePause = useCallback(() => {
    setAwaitingGate(true);
    setGateState(g => ({ ...g, [currentUserId]: false }));
  }, [currentUserId]);

  const handleModeSelect = (m) => {
    setMode(m);
    setGateState({});
    if (m === 'screenshare') onStartScreenShare?.();
  };

  const handleYouTubeConfirm = (id) => {
    const socket = socketService.socket;
    if (socket) socket.emit('watch:youtube_start', { room_id: roomId, user_id: currentUserId, video_id: id });
    setVideoId(id);
    setGateState({ [currentUserId]: false });
  };

  // Listen for partner starting YouTube
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;
    const handleYTStart = ({ video_id }) => {
      setVideoId(video_id);
      setMode('youtube');
      setGateState(g => ({ ...g, [partnerId]: false }));
    };
    socket.on('watch:youtube_start', handleYTStart);
    return () => socket.off('watch:youtube_start', handleYTStart);
  }, [partnerId]);

  if (!isOpen) return null;

  const showFullscreenPlayer = mode === 'youtube' && videoId;
  const showScreenShareGate = mode === 'screenshare';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,3,12,0.75)', backdropFilter: 'blur(8px)',
    }}>
      <style>{WP_CSS}</style>

      {/* Full-screen YouTube player mode */}
      {showFullscreenPlayer ? (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px',
            background: 'rgba(13,11,26,0.9)',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Youtube size={16} color="#ff4444" />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Watching together</span>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: C.online,
                boxShadow: `0 0 6px ${C.online}`, marginLeft: 4,
              }} />
            </div>
            <button onClick={onClose} style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.muted, cursor: 'pointer', padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
            }}>
              <X size={13} /> Close
            </button>
          </div>
          <YouTubePlayer
            videoId={videoId}
            roomId={roomId}
            myUserId={currentUserId}
            gateState={gateState}
            onReady={handleReady}
            partnerName={partnerName}
            onPause={handlePause}
          />
        </div>
      ) : (
        // Card-based picker/input/screen-share gate
        <GlassCard style={{ width: '100%', maxWidth: 380, margin: '0 16px', position: 'relative' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 1,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.muted, cursor: 'pointer', padding: 6, display: 'flex',
            }}
          >
            <X size={16} />
          </button>

          {!mode && <ModePicker onSelect={handleModeSelect} />}

          {mode === 'youtube' && !videoId && (
            <>
              <button
                onClick={() => setMode(null)}
                style={{
                  background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
                  padding: '16px 24px 0',
                }}
              >
                ← Back
              </button>
              <YouTubeInput onConfirm={handleYouTubeConfirm} />
            </>
          )}

          {showScreenShareGate && (
            <div style={{ padding: '24px' }}>
              <button
                onClick={() => { setMode(null); onStartScreenShare?.(); }}
                style={{
                  background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16,
                  padding: 0,
                }}
              >
                ← Back
              </button>
              <p style={{ margin: '0 0 20px', fontWeight: 700, fontSize: 18, color: C.text }}>
                Screen sharing started — tap Ready when you're on the right scene
              </p>
              <GateOverlay
                gateState={gateState}
                myUserId={currentUserId}
                onReady={handleReady}
                partnerName={partnerName}
                mode="screenshare"
              />
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
