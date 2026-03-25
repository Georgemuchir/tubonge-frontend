import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming, RefreshCw } from 'lucide-react';
import Peer from 'simple-peer/simplepeer.min.js';
import socketService from '../../services/socket';

const CALL_STATE = {
  IDLE: 'idle',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
};

// Deterministic star positions so they don't re-randomise on re-render
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 97) + 1.5,
  y: ((i * 61 + 7)  % 95) + 2.5,
  size: (i % 3) + 1,
  delay: (i * 0.17) % 3,
  dur: 1.4 + (i % 5) * 0.3,
}));

const StarField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {STARS.map(s => (
      <div
        key={s.id}
        className="absolute rounded-full bg-white"
        style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          animation: `cm-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }}
      />
    ))}
  </div>
);

const DISNEY_CSS = `
  @keyframes cm-twinkle {
    0%,100% { opacity:0.1; transform:scale(0.4); }
    50%      { opacity:1;   transform:scale(1); }
  }
  @keyframes cm-float {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-10px); }
  }
  @keyframes cm-ring {
    0%   { transform:scale(1);   opacity:0.65; }
    100% { transform:scale(2.4); opacity:0; }
  }
  @keyframes cm-gold-pulse {
    0%,100% { box-shadow:0 0 18px 4px rgba(240,192,64,.55),0 0 36px 8px rgba(160,100,230,.3); }
    50%      { box-shadow:0 0 32px 8px rgba(240,192,64,.9), 0 0 64px 16px rgba(160,100,230,.5); }
  }
  @keyframes cm-dot {
    0%,80%,100% { opacity:0.15; transform:scale(0.7); }
    40%          { opacity:1;    transform:scale(1); }
  }
  @keyframes cm-btn-glow {
    0%,100% { box-shadow:0 0 8px rgba(240,192,64,.3); }
    50%      { box-shadow:0 0 18px rgba(240,192,64,.7); }
  }
  .cm-glow-avatar { animation:cm-gold-pulse 2.2s ease-in-out infinite; }
  .cm-float       { animation:cm-float 3.2s ease-in-out infinite; }
  .cm-ring1       { animation:cm-ring 2s ease-out infinite; }
  .cm-ring2       { animation:cm-ring 2s ease-out .7s infinite; }
  .cm-ring3       { animation:cm-ring 2s ease-out 1.4s infinite; }
  .cm-dot1        { animation:cm-dot 1.4s ease-in-out 0s infinite; }
  .cm-dot2        { animation:cm-dot 1.4s ease-in-out .25s infinite; }
  .cm-dot3        { animation:cm-dot 1.4s ease-in-out .5s infinite; }
`;

const DisneyBg = () => (
  <div
    className="absolute inset-0"
    style={{ background: 'radial-gradient(ellipse at 40% 30%, #1e0b4e 0%, #0d0d30 45%, #050518 100%)' }}
  />
);

const Avatar = ({ name, size = 'lg', glow = false, float = false }) => {
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const px = size === 'lg' ? 'w-28 h-28 text-4xl' : 'w-20 h-20 text-2xl';
  return (
    <div className={`relative inline-flex items-center justify-center ${float ? 'cm-float' : ''}`}>
      {glow && (
        <>
          <div className="cm-ring1 absolute inset-0 rounded-full border-2 border-yellow-300/60" />
          <div className="cm-ring2 absolute inset-0 rounded-full border-2 border-purple-400/50" />
          <div className="cm-ring3 absolute inset-0 rounded-full border-2 border-blue-300/40" />
        </>
      )}
      <div
        className={`${px} rounded-full flex items-center justify-center text-white font-bold relative z-10 ${glow ? 'cm-glow-avatar' : ''}`}
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb,#0891b2)' }}
      >
        {letter}
      </div>
    </div>
  );
};

const GlassBtn = ({ onClick, children, className = '', title = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${className}`}
    style={{ backdropFilter: 'blur(12px)' }}
  >
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────

const CallManager = forwardRef(({ currentUser, selectedUser }, ref) => {
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callType, setCallType] = useState('video');
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [facingMode, setFacingMode] = useState('user');
  const [isOutgoing, setIsOutgoing] = useState(true); // false when we accepted an incoming call

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callStateRef = useRef(callState);
  const selectedUserRef = useRef(selectedUser);
  const targetIdRef = useRef(null);
  const callTypeRef = useRef('video');
  const iceCandidateBuffer = useRef([]);
  const answerAppliedRef = useRef(false);
  const remoteStreamRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── Ringtone ──
  const playRingtone = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      const interval = setInterval(() => {
        gain.gain.value = gain.gain.value > 0 ? 0 : 0.3;
      }, 1000);
      ringtoneRef.current = { ctx, osc, interval };
    } catch (e) {
      console.warn('[CALL] Could not play ringtone:', e.message);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      try {
        clearInterval(ringtoneRef.current.interval);
        ringtoneRef.current.osc.stop();
        ringtoneRef.current.ctx.close();
      } catch (e) { /* ok */ }
      ringtoneRef.current = null;
    }
  }, []);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    stopRingtone();
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { /* ok */ }
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    targetIdRef.current = null;
    iceCandidateBuffer.current = [];
    answerAppliedRef.current = false;
    remoteStreamRef.current = null;
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [stopRingtone]);

  // ── Get user media ──
  const getMedia = useCallback(async (type) => {
    const constraints = {
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000, channelCount: 1 },
      video: type === 'video' ? { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, frameRate: { ideal: 30, min: 15 }, facingMode } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
    }
    return stream;
  }, [facingMode]);

  // ── Attach remote stream ──
  const attachRemoteStream = useCallback((remoteStream) => {
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play().catch(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = true;
          remoteVideoRef.current.play().catch(() => {});
        }
      });
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, []);

  // ── Start timer (guarded — only starts once) ──
  const startTimer = useCallback(() => {
    if (callTimerRef.current) return;
    setCallState(CALL_STATE.CONNECTED);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }, []);

  // ── ICE quality monitor ──
  const monitorConnection = useCallback((peer) => {
    try {
      const pc = peer._pc;
      if (!pc) return;
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') setConnectionQuality('good');
        else if (state === 'disconnected') setConnectionQuality('reconnecting');
        else if (state === 'failed') {
          setConnectionQuality('poor');
          setError('Connection lost');
          setTimeout(() => setError(''), 3000);
        }
      };
    } catch (e) { /* ok */ }
  }, []);

  // ── Flip camera ──
  const flipCamera = useCallback(async () => {
    if (!peerRef.current || !localStreamRef.current) return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const newVT = newStream.getVideoTracks()[0];
      const oldVT = localStreamRef.current.getVideoTracks()[0];
      if (peerRef.current._pc) {
        const sender = peerRef.current._pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(newVT);
      }
      if (oldVT) { localStreamRef.current.removeTrack(oldVT); oldVT.stop(); }
      localStreamRef.current.addTrack(newVT);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setFacingMode(newFacing);
    } catch (e) {
      console.error('[CALL] Flip camera failed:', e.message);
    }
  }, [facingMode]);

  // ── End call ──
  const endCall = useCallback(() => {
    const tid = targetIdRef.current;
    const wasCalling = callStateRef.current === CALL_STATE.CALLING;
    if (tid) {
      socketService.endCall(currentUserId, tid, currentUserId);
      if (wasCalling) socketService.missedCall(currentUserId, tid, callTypeRef.current);
    }
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [currentUserId, cleanup]);

  // ── Start a call ──
  const startCall = useCallback(async (type) => {
    const su = selectedUserRef.current;
    if (!su || callStateRef.current !== CALL_STATE.IDLE) return;

    const targetId = su.id || su._id;
    targetIdRef.current = targetId;
    callTypeRef.current = type;

    try {
      setCallType(type);
      setCallState(CALL_STATE.CALLING);
      setIsOutgoing(true);
      setError('');
      answerAppliedRef.current = false;

      const stream = await getMedia(type);
      stream.getAudioTracks().forEach(t => { t.enabled = true; });

      const peer = new Peer({
        initiator: true, trickle: true, stream,
        config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]},
      });

      let offerSent = false;
      peer.on('signal', (sd) => {
        if (!offerSent && sd.type === 'offer') {
          socketService.callUser(currentUserId, targetId, sd, type);
          offerSent = true;
        } else {
          socketService.sendIceCandidate(targetId, currentUserId, sd);
        }
      });
      peer.on('stream', attachRemoteStream);
      peer.on('connect', () => { startTimer(); setConnectionQuality('good'); });
      peer.on('close', () => { if (callStateRef.current === CALL_STATE.CONNECTED) endCall(); });
      peer.on('error', (err) => { if (callStateRef.current === CALL_STATE.CONNECTED) { setError('Connection lost'); endCall(); } });

      peerRef.current = peer;
      monitorConnection(peer);

      // 30-second ring timeout
      callTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === CALL_STATE.CALLING) {
          setError('No answer');
          const tid = targetIdRef.current;
          if (tid) { socketService.endCall(currentUserId, tid, currentUserId); socketService.missedCall(currentUserId, tid, type); }
          setCallState(CALL_STATE.IDLE);
          cleanup();
          setTimeout(() => setError(''), 3000);
        }
      }, 30000);

    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Camera/mic permission denied' : 'Failed to start call');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    }
  }, [currentUserId, getMedia, cleanup, endCall, attachRemoteStream, startTimer, monitorConnection]);

  // ── Accept incoming call ──
  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    stopRingtone();
    try {
      const type = incomingCallData.call_type || 'video';
      setCallType(type);
      callTypeRef.current = type;
      targetIdRef.current = incomingCallData.caller_id;
      setIsOutgoing(false);
      setCallState(CALL_STATE.CALLING);

      const stream = await getMedia(type);
      stream.getAudioTracks().forEach(t => { t.enabled = true; });

      const peer = new Peer({
        initiator: false, trickle: true, stream,
        config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]},
      });

      let answerSent = false;
      peer.on('signal', (sd) => {
        if (!answerSent && sd.type === 'answer') {
          socketService.acceptCall(incomingCallData.caller_id, currentUserId, sd);
          answerSent = true;
        } else {
          socketService.sendIceCandidate(incomingCallData.caller_id, currentUserId, sd);
        }
      });
      peer.on('stream', attachRemoteStream);
      peer.on('connect', () => { startTimer(); setConnectionQuality('good'); });
      peer.on('close', () => { if (callStateRef.current === CALL_STATE.CONNECTED) endCall(); });
      peer.on('error', () => { if (callStateRef.current === CALL_STATE.CONNECTED) { setError('Connection lost'); endCall(); } });

      monitorConnection(peer);
      peer.signal(incomingCallData.signal_data);
      peerRef.current = peer;

      if (iceCandidateBuffer.current.length > 0) {
        iceCandidateBuffer.current.forEach(c => { if (!peer.destroyed) peer.signal(c); });
        iceCandidateBuffer.current = [];
      }
    } catch (err) {
      rejectCall();
    }
  }, [incomingCallData, currentUserId, getMedia, endCall, stopRingtone, attachRemoteStream, startTimer, monitorConnection]);

  // ── Reject call ──
  const rejectCall = useCallback(() => {
    stopRingtone();
    if (incomingCallData) socketService.rejectCall(incomingCallData.caller_id, currentUserId);
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [incomingCallData, currentUserId, cleanup, stopRingtone]);

  // ── Toggle mute / video ──
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const t = localStreamRef.current.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
    }
  }, []);

  // ── Re-attach streams after UI mounts ──
  useEffect(() => {
    if ((callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) && localStreamRef.current && localVideoRef.current && !localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
    }
  }, [callState]);

  useEffect(() => {
    if ((callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) && remoteStreamRef.current) {
      if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.play().catch(() => { if (remoteVideoRef.current) { remoteVideoRef.current.muted = true; remoteVideoRef.current.play().catch(() => {}); } });
      }
      if (remoteAudioRef.current && !remoteAudioRef.current.srcObject) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [callState]);

  // ── Expose startCall via ref ──
  useImperativeHandle(ref, () => ({ startCall }), [startCall]);

  // ── Socket listeners ──
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleIncomingCall = (data) => {
      if (callStateRef.current === CALL_STATE.INCOMING) return;
      if (callStateRef.current !== CALL_STATE.IDLE) { socketService.rejectCall(data.caller_id, currentUserId); return; }
      iceCandidateBuffer.current = [];
      setIncomingCallData(data);
      setCallState(CALL_STATE.INCOMING);
      playRingtone();
    };

    const handleCallAccepted = (data) => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      if (peerRef.current && !peerRef.current.destroyed && data.signal_data && !answerAppliedRef.current) {
        answerAppliedRef.current = true;
        peerRef.current.signal(data.signal_data);
        // Start timer immediately when callee picks up
        startTimer();
      }
    };

    const handleCallRejected = () => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      setError('Call was declined');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    };

    const handleCallEnded = () => {
      setCallState(CALL_STATE.IDLE);
      setIncomingCallData(null);
      cleanup();
    };

    const handleCallUnavailable = (data) => {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
      setError(data.reason || 'User unavailable');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    };

    const handleIceCandidate = (data) => {
      if (peerRef.current && !peerRef.current.destroyed) {
        try { peerRef.current.signal(data.candidate); } catch (e) { /* ok */ }
      } else if (!peerRef.current) {
        iceCandidateBuffer.current.push(data.candidate);
      }
    };

    socket.on('incoming_call',    handleIncomingCall);
    socket.on('call_accepted',    handleCallAccepted);
    socket.on('call_rejected',    handleCallRejected);
    socket.on('call_ended',       handleCallEnded);
    socket.on('call_unavailable', handleCallUnavailable);
    socket.on('ice_candidate',    handleIceCandidate);

    return () => {
      socket.off('incoming_call',    handleIncomingCall);
      socket.off('call_accepted',    handleCallAccepted);
      socket.off('call_rejected',    handleCallRejected);
      socket.off('call_ended',       handleCallEnded);
      socket.off('call_unavailable', handleCallUnavailable);
      socket.off('ice_candidate',    handleIceCandidate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const remoteName = incomingCallData?.caller_name || selectedUserRef.current?.name || 'Unknown';

  // ─── INCOMING CALL ───────────────────────────────────────────────────────
  if (callState === CALL_STATE.INCOMING && incomingCallData) {
    const isVideo = incomingCallData.call_type !== 'audio';
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <style>{DISNEY_CSS}</style>
        <DisneyBg />
        <StarField />

        {/* Card */}
        <div
          className="relative z-10 w-80 rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(18,8,50,0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(240,192,64,0.25)',
            boxShadow: '0 0 60px rgba(120,60,200,0.4), 0 0 0 1px rgba(240,192,64,0.1)',
          }}
        >
          {/* Sparkle line */}
          <p className="text-yellow-300/60 text-xs tracking-[0.35em] uppercase mb-6">
            ✦ {isVideo ? 'Video' : 'Voice'} Call ✦
          </p>

          <Avatar name={incomingCallData.caller_name} size="lg" glow float />

          <h3 className="mt-6 text-2xl font-bold text-white">{incomingCallData.caller_name}</h3>
          <p className="mt-1 text-purple-300/80 text-sm">
            Incoming {isVideo ? 'video' : 'voice'} call
            <span className="cm-dot1 inline-block ml-0.5 w-1 h-1 rounded-full bg-purple-300 align-middle" />
            <span className="cm-dot2 inline-block ml-0.5 w-1 h-1 rounded-full bg-purple-300 align-middle" />
            <span className="cm-dot3 inline-block ml-0.5 w-1 h-1 rounded-full bg-purple-300 align-middle" />
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-10 mt-10">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <GlassBtn
                onClick={rejectCall}
                className="w-16 h-16"
                style={{ background: 'rgba(220,38,38,0.85)', boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
                title="Decline"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </GlassBtn>
              <span className="text-xs text-red-400">Decline</span>
            </div>
            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <GlassBtn
                onClick={acceptCall}
                className="w-16 h-16"
                style={{
                  background: 'linear-gradient(135deg,#16a34a,#15803d)',
                  boxShadow: '0 0 20px rgba(22,163,74,0.6), 0 0 40px rgba(240,192,64,0.2)',
                  animation: 'cm-btn-glow 1.8s ease-in-out infinite',
                }}
                title="Accept"
              >
                <PhoneIncoming className="w-7 h-7 text-white" />
              </GlassBtn>
              <span className="text-xs text-green-400">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CALLING / CONNECTED ─────────────────────────────────────────────────
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) {
    const isConnected = callState === CALL_STATE.CONNECTED;

    // ── VIDEO CALL ──
    if (callType === 'video') {
      return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <style>{DISNEY_CSS}</style>

          {/* Remote video fills screen */}
          <div className="flex-1 relative overflow-hidden">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Top gradient overlay */}
            <div className="absolute inset-x-0 top-0 h-36 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(5,5,24,0.85) 0%, transparent 100%)' }} />

            {/* Status bar */}
            <div className="absolute top-0 inset-x-0 px-5 pt-5 flex items-start justify-between">
              <div>
                <p className="text-white font-bold text-xl leading-tight drop-shadow">{remoteName}</p>
                {isConnected ? (
                  <p className="text-yellow-300 text-sm font-mono mt-0.5 drop-shadow">{fmt(callDuration)}</p>
                ) : (
                  <p className="text-purple-300 text-sm mt-0.5 drop-shadow flex items-center gap-1">
                    {isOutgoing ? 'Ringing' : 'Connecting'}
                    <span className="cm-dot1 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
                    <span className="cm-dot2 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
                    <span className="cm-dot3 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
                  </p>
                )}
              </div>
              {connectionQuality !== 'good' && isConnected && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  connectionQuality === 'reconnecting' ? 'bg-yellow-500/80 text-black' : 'bg-red-500/80 text-white'
                }`}>
                  {connectionQuality === 'reconnecting' ? 'Reconnecting…' : 'Poor signal'}
                </span>
              )}
            </div>

            {/* Local video PiP */}
            <div
              className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: '1.5px solid rgba(240,192,64,0.4)', boxShadow: '0 0 16px rgba(120,60,200,0.5)' }}
            >
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            </div>

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(5,5,24,0.9) 0%, transparent 100%)' }} />
          </div>

          {/* Controls */}
          <div
            className="px-6 py-5 flex justify-center items-center gap-5"
            style={{ background: 'rgba(5,5,20,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(240,192,64,0.12)' }}
          >
            <GlassBtn onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
              className="w-13 h-13 w-[52px] h-[52px]"
              style={{
                background: isMuted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              {isMuted ? <MicOff className="w-5 h-5 text-gray-900" /> : <Mic className="w-5 h-5 text-white" />}
            </GlassBtn>

            <GlassBtn onClick={toggleVideo} title={isVideoOff ? 'Camera on' : 'Camera off'}
              className="w-[52px] h-[52px]"
              style={{
                background: isVideoOff ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              {isVideoOff ? <VideoOff className="w-5 h-5 text-gray-900" /> : <Video className="w-5 h-5 text-white" />}
            </GlassBtn>

            <GlassBtn onClick={flipCamera} title="Flip camera"
              className="w-[52px] h-[52px]"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <RefreshCw className="w-5 h-5 text-white" />
            </GlassBtn>

            {/* End call — centre-stage */}
            <GlassBtn onClick={endCall} title="End call"
              className="w-[64px] h-[64px]"
              style={{
                background: 'linear-gradient(135deg,#dc2626,#991b1b)',
                boxShadow: '0 0 24px rgba(220,38,38,0.6), 0 0 0 1px rgba(220,38,38,0.3)',
              }}>
              <PhoneOff className="w-7 h-7 text-white" />
            </GlassBtn>
          </div>
        </div>
      );
    }

    // ── AUDIO CALL ──
    return (
      <div className="fixed inset-0 z-[100] flex flex-col">
        <style>{DISNEY_CSS}</style>
        <DisneyBg />
        <StarField />
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
          {/* Sparkle label */}
          <p className="text-yellow-300/50 text-xs tracking-[0.3em] uppercase mb-10">
            ✦ Voice Call ✦
          </p>

          {/* Avatar */}
          <Avatar name={remoteName} size="lg" glow float />

          {/* Name */}
          <h2 className="mt-8 text-3xl font-bold text-white tracking-wide">{remoteName}</h2>

          {/* Status / Timer */}
          <div className="mt-3 h-8 flex items-center justify-center">
            {isConnected ? (
              <p className="text-yellow-300 text-xl font-mono tracking-widest">{fmt(callDuration)}</p>
            ) : (
              <p className="text-purple-300 text-base flex items-center gap-1.5">
                {isOutgoing ? 'Ringing' : 'Connecting'}
                <span className="cm-dot1 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
                <span className="cm-dot2 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
                <span className="cm-dot3 inline-block w-1.5 h-1.5 rounded-full bg-purple-300" />
              </p>
            )}
          </div>

          {/* Connection quality */}
          {isConnected && connectionQuality !== 'good' && (
            <span className={`mt-3 text-xs px-3 py-1 rounded-full ${
              connectionQuality === 'reconnecting' ? 'bg-yellow-500/80 text-black' : 'bg-red-500/80 text-white'
            }`}>
              {connectionQuality === 'reconnecting' ? 'Reconnecting…' : 'Poor signal'}
            </span>
          )}
        </div>

        {/* Controls */}
        <div
          className="relative z-10 px-8 py-8 flex justify-center items-center gap-6"
          style={{ background: 'rgba(5,5,20,0.7)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(240,192,64,0.1)' }}
        >
          {/* Mute */}
          <div className="flex flex-col items-center gap-2">
            <GlassBtn onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
              className="w-[56px] h-[56px]"
              style={{
                background: isMuted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
              {isMuted ? <MicOff className="w-6 h-6 text-gray-900" /> : <Mic className="w-6 h-6 text-white" />}
            </GlassBtn>
            <span className="text-xs text-white/50">{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-2">
            <GlassBtn onClick={endCall} title="End call"
              className="w-[72px] h-[72px]"
              style={{
                background: 'linear-gradient(135deg,#dc2626,#991b1b)',
                boxShadow: '0 0 28px rgba(220,38,38,0.65), 0 0 0 1px rgba(220,38,38,0.35)',
              }}>
              <PhoneOff className="w-8 h-8 text-white" />
            </GlassBtn>
            <span className="text-xs text-red-400">End</span>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE — error toast only ──
  if (error) {
    return (
      <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm text-white"
        style={{ background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 0 16px rgba(220,38,38,0.5)' }}>
        {error}
      </div>
    );
  }
  return null;
});

CallManager.displayName = 'CallManager';
export default CallManager;
