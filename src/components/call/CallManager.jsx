import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming, RefreshCw, ScreenShare, ScreenShareOff, Tv2 } from 'lucide-react';
import Peer from 'simple-peer/simplepeer.min.js';
import socketService from '../../services/socket';
import WatchPartyOverlay from './WatchPartyOverlay';

const CALL_STATE = {
  IDLE: 'idle',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
};

const CALL_CSS = `
  @keyframes cm-ring {
    0%   { transform:scale(1);   opacity:0.5; }
    100% { transform:scale(1.9); opacity:0; }
  }
  @keyframes cm-dot {
    0%,80%,100% { opacity:0.25; }
    40%          { opacity:1; }
  }
  .cm-ring1 { animation:cm-ring 2s ease-out infinite; }
  .cm-ring2 { animation:cm-ring 2s ease-out .65s infinite; }
  .cm-dot1  { animation:cm-dot 1.4s ease-in-out 0s infinite; }
  .cm-dot2  { animation:cm-dot 1.4s ease-in-out .25s infinite; }
  .cm-dot3  { animation:cm-dot 1.4s ease-in-out .5s infinite; }
`;

const CallAvatar = ({ name, size = 'lg', pulse = false }) => {
  const letter = name?.charAt(0)?.toUpperCase() || '?';
  const dim = size === 'lg' ? 'w-24 h-24 text-4xl' : 'w-16 h-16 text-2xl';
  return (
    <div className="relative inline-flex items-center justify-center">
      {pulse && (
        <>
          <div className="cm-ring1 absolute inset-0 rounded-full bg-teal-500/30" />
          <div className="cm-ring2 absolute inset-0 rounded-full bg-teal-500/20" />
        </>
      )}
      <div className={`${dim} rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold relative z-10`}>
        {letter}
      </div>
    </div>
  );
};

const Btn = ({ onClick, children, className = '', title = '' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${className}`}
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [facingMode, setFacingMode] = useState('user');
  const [isOutgoing, setIsOutgoing] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [watchPartyOpen, setWatchPartyOpen] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
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
      } catch {}
      ringtoneRef.current = null;
    }
  }, []);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    stopRingtone();
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch {}
      peerRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
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
    setIsScreenSharing(false);
    setShowControls(true);
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

  // ── Start timer (guarded — only starts once) ──
  const startTimer = useCallback(() => {
    if (callTimerRef.current) return;
    setCallState(CALL_STATE.CONNECTED);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
  }, []);

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
    // Remote stream arriving = connection is live on both sides → start timer
    startTimer();
  }, [startTimer]);

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
    } catch {}
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
      peer.on('error', () => { if (callStateRef.current === CALL_STATE.CONNECTED) { setError('Connection lost'); endCall(); } });

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
    } catch {
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

  // Revert to camera after screen share ends (called by button or browser "Stop sharing")
  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);
    if (!peerRef.current || !localStreamRef.current) return;
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const camTrack = camStream.getVideoTracks()[0];
      const sender = peerRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(camTrack);
      localStreamRef.current.getVideoTracks().forEach(t => { localStreamRef.current.removeTrack(t); t.stop(); });
      localStreamRef.current.addTrack(camTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    } catch {}
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!peerRef.current || !localStreamRef.current) return;
    if (isScreenSharing) { stopScreenShare(); return; }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      const sender = peerRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      localStreamRef.current.getVideoTracks().forEach(t => { localStreamRef.current.removeTrack(t); });
      localStreamRef.current.addTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(true);
      screenTrack.addEventListener('ended', stopScreenShare, { once: true });
    } catch (e) {
      if (e.name !== 'NotAllowedError') console.error('[CALL] Screen share failed:', e.message);
    }
  }, [isScreenSharing, stopScreenShare]);

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
        try { peerRef.current.signal(data.candidate); } catch {}
      } else if (!peerRef.current) {
        iceCandidateBuffer.current.push(data.candidate);
      }
    };

    const handleWatchInvited = () => setWatchPartyOpen(true);

    socket.on('incoming_call',    handleIncomingCall);
    socket.on('call_accepted',    handleCallAccepted);
    socket.on('call_rejected',    handleCallRejected);
    socket.on('call_ended',       handleCallEnded);
    socket.on('call_unavailable', handleCallUnavailable);
    socket.on('ice_candidate',    handleIceCandidate);
    socket.on('watch:invited',    handleWatchInvited);

    return () => {
      socket.off('incoming_call',    handleIncomingCall);
      socket.off('call_accepted',    handleCallAccepted);
      socket.off('call_rejected',    handleCallRejected);
      socket.off('call_ended',       handleCallEnded);
      socket.off('call_unavailable', handleCallUnavailable);
      socket.off('ice_candidate',    handleIceCandidate);
      socket.off('watch:invited',    handleWatchInvited);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const remoteName = incomingCallData?.caller_name || selectedUserRef.current?.name || 'Unknown';

  // ─── INCOMING CALL ───────────────────────────────────────────────────────
  if (callState === CALL_STATE.INCOMING && incomingCallData) {
    const isVideo = incomingCallData.call_type !== 'audio';
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <style>{CALL_CSS}</style>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-72 text-center shadow-2xl">
          <CallAvatar name={incomingCallData.caller_name} size="lg" pulse />

          <h3 className="mt-5 text-xl font-semibold text-white">{incomingCallData.caller_name}</h3>
          <p className="mt-1 text-gray-400 text-sm flex items-center justify-center gap-1">
            Incoming {isVideo ? 'video' : 'voice'} call
            <span className="cm-dot1 inline-block w-1 h-1 rounded-full bg-gray-400 ml-1" />
            <span className="cm-dot2 inline-block w-1 h-1 rounded-full bg-gray-400" />
            <span className="cm-dot3 inline-block w-1 h-1 rounded-full bg-gray-400" />
          </p>

          <div className="flex justify-center gap-8 mt-8">
            <div className="flex flex-col items-center gap-1.5">
              <Btn onClick={rejectCall} title="Decline"
                className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white">
                <PhoneOff className="w-6 h-6" />
              </Btn>
              <span className="text-xs text-gray-500">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn onClick={acceptCall} title="Accept"
                className="w-14 h-14 bg-teal-600 hover:bg-teal-500 text-white">
                <PhoneIncoming className="w-6 h-6" />
              </Btn>
              <span className="text-xs text-gray-500">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CALLING / CONNECTED ─────────────────────────────────────────────────
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) {
    const isConnected = callState === CALL_STATE.CONNECTED;

    const StatusLine = () => isConnected ? (
      <p className="text-teal-400 text-sm font-mono mt-1">{fmt(callDuration)}</p>
    ) : (
      <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
        {isOutgoing ? 'Ringing' : 'Connecting'}
        <span className="cm-dot1 inline-block w-1 h-1 rounded-full bg-gray-400" />
        <span className="cm-dot2 inline-block w-1 h-1 rounded-full bg-gray-400" />
        <span className="cm-dot3 inline-block w-1 h-1 rounded-full bg-gray-400" />
      </p>
    );

    // ── VIDEO CALL ──
    if (callType === 'video') {
      return (
        <>
        <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
          <style>{CALL_CSS}</style>

          {/* Main video area — tap to toggle controls when connected */}
          <div
            className="flex-1 relative overflow-hidden"
            onClick={() => isConnected && setShowControls(c => !c)}
            style={{ cursor: isConnected ? 'pointer' : 'default' }}
          >
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Top overlay */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
            <div className="absolute top-0 inset-x-0 px-4 pt-4 flex items-start justify-between pointer-events-none">
              <div>
                <p className="text-white font-semibold text-lg drop-shadow">{remoteName}</p>
                <StatusLine />
              </div>
              {isConnected && connectionQuality !== 'good' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  connectionQuality === 'reconnecting' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
                }`}>
                  {connectionQuality === 'reconnecting' ? 'Reconnecting…' : 'Poor signal'}
                </span>
              )}
            </div>

            {/* Local PiP */}
            <div className="absolute top-16 right-3 w-24 h-36 rounded-xl overflow-hidden border border-gray-600 shadow-lg">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={isScreenSharing ? {} : { transform: 'scaleX(-1)' }} />
            </div>

            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          {/* Controls bar — slides down to hide on tap */}
          <div className={`bg-gray-900 border-t border-gray-700 px-6 py-5 flex justify-center items-center gap-5 transition-transform duration-300 ease-in-out ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
            <Btn onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
              className={`w-14 h-14 ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Btn>
            <Btn onClick={toggleVideo} title={isVideoOff ? 'Camera on' : 'Camera off'}
              className={`w-14 h-14 ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Btn>
            <Btn onClick={flipCamera} title="Flip camera"
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 text-white">
              <RefreshCw className="w-6 h-6" />
            </Btn>
            <Btn onClick={toggleScreenShare} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              className={`w-14 h-14 ${isScreenSharing ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
              {isScreenSharing ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
            </Btn>
            <Btn onClick={() => setWatchPartyOpen(true)} title="Watch Together"
              className={`w-14 h-14 ${watchPartyOpen ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
              <Tv2 className="w-6 h-6" />
            </Btn>
            <Btn onClick={endCall} title="End call"
              className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white">
              <PhoneOff className="w-7 h-7" />
            </Btn>
          </div>
        </div>

        {watchPartyOpen && (
          <WatchPartyOverlay
            isOpen={watchPartyOpen}
            onClose={() => setWatchPartyOpen(false)}
            currentUserId={currentUserId}
            partnerId={targetIdRef.current || incomingCallData?.caller_id}
            partnerName={remoteName}
            onStartScreenShare={toggleScreenShare}
          />
        )}
      </>
      );
    }

    // ── AUDIO CALL ──
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col overflow-hidden">
        <style>{CALL_CSS}</style>
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Main area — tap to toggle controls when connected */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6"
          onClick={() => isConnected && setShowControls(c => !c)}
          style={{ cursor: isConnected ? 'pointer' : 'default' }}
        >
          <CallAvatar name={remoteName} size="lg" pulse={!isConnected} />
          <h2 className="mt-6 text-2xl font-semibold text-white">{remoteName}</h2>
          <StatusLine />
          {isConnected && connectionQuality !== 'good' && (
            <span className={`mt-3 text-xs px-3 py-1 rounded-full ${
              connectionQuality === 'reconnecting' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
            }`}>
              {connectionQuality === 'reconnecting' ? 'Reconnecting…' : 'Poor signal'}
            </span>
          )}
        </div>

        {/* Controls — slides down to hide on tap */}
        <div className={`bg-gray-800 border-t border-gray-700 px-8 py-8 flex justify-center items-center gap-8 transition-transform duration-300 ease-in-out ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex flex-col items-center gap-1.5">
            <Btn onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
              className={`w-16 h-16 ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
              {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </Btn>
            <span className="text-xs text-gray-500">{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Btn onClick={endCall} title="End call"
              className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white">
              <PhoneOff className="w-8 h-8" />
            </Btn>
            <span className="text-xs text-gray-500">End</span>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE — error toast only ──
  if (error) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
        {error}
      </div>
    );
  }
  return null;
});

CallManager.displayName = 'CallManager';
export default CallManager;
