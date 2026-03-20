import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming, RefreshCw } from 'lucide-react';
import Peer from 'simple-peer/simplepeer.min.js';
import socketService from '../../services/socket';

const CALL_STATE = {
  IDLE: 'idle',
  CALLING: 'calling',
  INCOMING: 'incoming',
  CONNECTED: 'connected',
};

const CallManager = forwardRef(({ currentUser, selectedUser }, ref) => {
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callType, setCallType] = useState('video');
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState('');
  const [connectionQuality, setConnectionQuality] = useState('good'); // 'good' | 'poor' | 'reconnecting'
  const [facingMode, setFacingMode] = useState('user');

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callStateRef = useRef(callState);
  const selectedUserRef = useRef(selectedUser);
  const targetIdRef = useRef(null);
  const callTypeRef = useRef('video');
  const iceCandidateBuffer = useRef([]);

  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── Ringtone helpers ──
  const playRingtone = useCallback(() => {
    try {
      // Use Web Audio API oscillator as ringtone (no external file needed)
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      // Ring pattern: on 1s, off 2s
      const interval = setInterval(() => {
        gain.gain.value = gain.gain.value > 0 ? 0 : 0.3;
      }, 1000);
      ringtoneRef.current = { ctx, osc, interval };
      console.log('[CALL] Ringtone started');
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
      console.log('[CALL] Ringtone stopped');
    }
  }, []);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    console.log('[CALL] cleanup called');
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
    targetIdRef.current = null;
    iceCandidateBuffer.current = [];
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [stopRingtone]);

  // ── Get user media ──
  const getMedia = useCallback(async (type) => {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      },
      video: type === 'video' ? {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
        facingMode: facingMode
      } : false
    };
    console.log('[CALL] getUserMedia constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true; // prevent hearing yourself
    }
    return stream;
  }, [facingMode]);

  // ── Robust remote stream attach ──
  const attachRemoteStream = useCallback((remoteStream) => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream;
    remoteVideoRef.current.volume = 1.0;
    remoteVideoRef.current.play().catch(() => {
      // Autoplay blocked — mute and retry
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.play().catch(e => console.error('[CALL] Remote play failed:', e));
    });
  }, []);

  // ── Monitor ICE connection quality ──
  const monitorConnection = useCallback((peer) => {
    try {
      const pc = peer._pc;
      if (!pc) return;
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('[CALL] ICE state:', state);
        if (state === 'connected' || state === 'completed') setConnectionQuality('good');
        else if (state === 'disconnected') {
          setConnectionQuality('reconnecting');
          // ICE will try to reconnect automatically
        } else if (state === 'failed') {
          setConnectionQuality('poor');
          setError('Connection lost — call quality degraded');
          setTimeout(() => setError(''), 3000);
        }
      };
    } catch (e) {
      console.warn('[CALL] Could not monitor ICE connection:', e.message);
    }
  }, []);

  // ── Flip camera (mobile) ──
  const flipCamera = useCallback(async () => {
    if (!peerRef.current || !localStreamRef.current) return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false // keep existing audio track
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      // Replace track in peer connection
      if (peerRef.current._pc) {
        const sender = peerRef.current._pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(newVideoTrack);
      }
      // Replace track in local stream
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setFacingMode(newFacing);
      console.log('[CALL] Camera flipped to', newFacing);
    } catch (e) {
      console.error('[CALL] Flip camera failed:', e.message);
    }
  }, [facingMode]);

  // ── End active call ──
  const endCall = useCallback(() => {
    const tid = targetIdRef.current;
    const wasCalling = callStateRef.current === CALL_STATE.CALLING;
    console.log('[CALL] endCall, target:', tid, 'wasCalling:', wasCalling);

    if (tid) {
      socketService.endCall(currentUserId, tid, currentUserId);
      if (wasCalling) {
        socketService.missedCall(currentUserId, tid, callTypeRef.current);
      }
    }
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [currentUserId, cleanup]);

  // ── Start a call (caller side) ──
  const startCall = useCallback(async (type) => {
    const su = selectedUserRef.current;
    console.log('[CALL] startCall', type, 'to', su?.name, 'state:', callStateRef.current);
    if (!su || callStateRef.current !== CALL_STATE.IDLE) {
      console.log('[CALL] startCall blocked — no user or not idle');
      return;
    }

    const targetId = su.id || su._id;
    targetIdRef.current = targetId;
    callTypeRef.current = type;

    try {
      setCallType(type);
      setCallState(CALL_STATE.CALLING);
      setError('');

      const stream = await getMedia(type);
      console.log('[CALL] Got media, tracks:', stream.getTracks().map(t => t.kind));

      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      let offerSent = false;

      peer.on('signal', (signalData) => {
        if (!offerSent && signalData.type === 'offer') {
          console.log('[CALL] Sending SDP offer to', targetId);
          socketService.callUser(currentUserId, targetId, signalData, type);
          offerSent = true;
        } else {
          console.log('[CALL] Sending ICE candidate to', targetId);
          socketService.sendIceCandidate(targetId, currentUserId, signalData);
        }
      });

      peer.on('stream', (remoteStream) => {
        console.log('[CALL] Got remote stream');
        attachRemoteStream(remoteStream);
      });

      peer.on('connect', () => {
        console.log('[CALL] Peer data channel connected');
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        setCallState(CALL_STATE.CONNECTED);
        setConnectionQuality('good');
        callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });

      peer.on('close', () => {
        console.log('[CALL] Peer closed, state:', callStateRef.current);
        if (callStateRef.current === CALL_STATE.CONNECTED) endCall();
      });

      peer.on('error', (err) => {
        console.error('[CALL] Peer error:', err.message, 'state:', callStateRef.current);
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          setError('Connection lost');
          endCall();
        }
      });

      peerRef.current = peer;
      monitorConnection(peer);

      // 30s timeout for unanswered calls
      callTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === CALL_STATE.CALLING) {
          console.log('[CALL] Timeout — no answer');
          setError('No answer');
          const tid = targetIdRef.current;
          if (tid) {
            socketService.endCall(currentUserId, tid, currentUserId);
            socketService.missedCall(currentUserId, tid, type);
          }
          setCallState(CALL_STATE.IDLE);
          cleanup();
          setTimeout(() => setError(''), 3000);
        }
      }, 30000);

    } catch (err) {
      console.error('[CALL] startCall error:', err);
      setError(err.name === 'NotAllowedError' ? 'Camera/mic permission denied' : 'Failed to start call');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    }
  }, [currentUserId, getMedia, cleanup, endCall]);

  // ── Accept incoming call (callee side) ──
  const acceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    console.log('[CALL] Accepting call from', incomingCallData.caller_name);
    stopRingtone();

    try {
      const type = incomingCallData.call_type || 'video';
      setCallType(type);
      callTypeRef.current = type;
      targetIdRef.current = incomingCallData.caller_id;

      const stream = await getMedia(type);
      console.log('[CALL] Callee got media, tracks:', stream.getTracks().map(t => t.kind));

      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });

      let answerSent = false;

      peer.on('signal', (signalData) => {
        if (!answerSent && signalData.type === 'answer') {
          console.log('[CALL] Sending SDP answer to caller');
          socketService.acceptCall(incomingCallData.caller_id, currentUserId, signalData);
          answerSent = true;
        } else {
          console.log('[CALL] Callee sending ICE candidate');
          socketService.sendIceCandidate(incomingCallData.caller_id, currentUserId, signalData);
        }
      });

      peer.on('stream', (remoteStream) => {
        console.log('[CALL] Callee got remote stream');
        attachRemoteStream(remoteStream);
      });

      peer.on('connect', () => {
        console.log('[CALL] Callee peer connected');
        setCallState(CALL_STATE.CONNECTED);
        setConnectionQuality('good');
        callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      });

      peer.on('close', () => {
        console.log('[CALL] Callee peer closed, state:', callStateRef.current);
        if (callStateRef.current === CALL_STATE.CONNECTED) endCall();
      });

      peer.on('error', (err) => {
        console.error('[CALL] Callee peer error:', err.message);
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          setError('Connection lost');
          endCall();
        }
      });

      monitorConnection(peer);

      // Signal the caller's SDP offer to our peer
      console.log('[CALL] Signaling caller offer to peer');
      peer.signal(incomingCallData.signal_data);
      peerRef.current = peer;

      // Apply any buffered ICE candidates
      if (iceCandidateBuffer.current.length > 0) {
        console.log('[CALL] Applying', iceCandidateBuffer.current.length, 'buffered ICE candidates');
        iceCandidateBuffer.current.forEach(c => peer.signal(c));
        iceCandidateBuffer.current = [];
      }

      setCallState(CALL_STATE.CONNECTED);
    } catch (err) {
      console.error('[CALL] acceptCall error:', err);
      rejectCall();
    }
  }, [incomingCallData, currentUserId, getMedia, endCall, stopRingtone]);

  // ── Reject incoming call ──
  const rejectCall = useCallback(() => {
    stopRingtone();
    if (incomingCallData) {
      socketService.rejectCall(incomingCallData.caller_id, currentUserId);
    }
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

  // ── Ensure local video is shown after UI mounts (fixes callee local preview) ──
  useEffect(() => {
    if (
      (callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) &&
      localStreamRef.current &&
      localVideoRef.current &&
      !localVideoRef.current.srcObject
    ) {
      console.log('[CALL] Re-attaching local stream to video element (callee fix)');
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
    }
  }, [callState]);

  // ── Expose startCall to parent via ref ──
  useImperativeHandle(ref, () => ({
    startCall,
  }), [startCall]);

  // ── Socket event listeners (register ONCE per userId) ──
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) {
      console.warn('[CALL] Socket not available yet — listeners NOT registered!');
      return;
    }
    console.log('[CALL] Registering socket listeners, userId:', currentUserId, 'socket.id:', socket.id);

    const handleIncomingCall = (data) => {
      console.log('[CALL] 📞 incoming_call event:', data.caller_name, data.call_type, 'state:', callStateRef.current);
      // If already showing incoming from same caller, ignore duplicate
      if (callStateRef.current === CALL_STATE.INCOMING) {
        console.log('[CALL] Already showing incoming call — ignoring duplicate');
        return;
      }
      if (callStateRef.current !== CALL_STATE.IDLE) {
        console.log('[CALL] Already in call, auto-rejecting');
        socketService.rejectCall(data.caller_id, currentUserId);
        return;
      }
      iceCandidateBuffer.current = [];
      setIncomingCallData(data);
      setCallState(CALL_STATE.INCOMING);
      // Play ringtone
      playRingtone();
    };

    const handleCallAccepted = (data) => {
      console.log('[CALL] ✅ call_accepted event, signaling answer to peer');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      if (peerRef.current && data.signal_data) {
        peerRef.current.signal(data.signal_data);
      }
    };

    const handleCallRejected = () => {
      console.log('[CALL] ❌ call_rejected event');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setError('Call was declined');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    };

    const handleCallEnded = () => {
      console.log('[CALL] 🔚 call_ended event');
      setCallState(CALL_STATE.IDLE);
      setIncomingCallData(null);
      cleanup();
    };

    const handleCallUnavailable = (data) => {
      console.log('[CALL] ⚠️ call_unavailable:', data.reason);
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setError(data.reason || 'User unavailable');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    };

    const handleIceCandidate = (data) => {
      console.log('[CALL] 🧊 ice_candidate received from', data.from_id);
      if (peerRef.current) {
        try {
          peerRef.current.signal(data.candidate);
        } catch (e) {
          console.warn('[CALL] Failed to signal ICE candidate:', e.message);
        }
      } else {
        console.log('[CALL] Buffering ICE candidate (peer not ready)');
        iceCandidateBuffer.current.push(data.candidate);
      }
    };

    // Register directly on the socket instance
    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_unavailable', handleCallUnavailable);
    socket.on('ice_candidate', handleIceCandidate);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_unavailable', handleCallUnavailable);
      socket.off('ice_candidate', handleIceCandidate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Format duration
  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── INCOMING CALL UI ──
  if (callState === CALL_STATE.INCOMING && incomingCallData) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        {/* Ring animation CSS */}
        <style>{`
          @keyframes ring-pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }
        `}</style>
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 w-80 text-center shadow-2xl border border-gray-700">
          <div className="relative mx-auto mb-4 w-24 h-24 flex items-center justify-center">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-green-500/30" style={{ animation: 'ring-pulse 1.5s ease-out infinite' }} />
            <div className="absolute inset-0 rounded-full bg-green-500/20" style={{ animation: 'ring-pulse 1.5s ease-out infinite 0.5s' }} />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold z-10">
              {incomingCallData.caller_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-1">{incomingCallData.caller_name}</h3>
          <p className="text-gray-400 mb-8">
            Incoming {incomingCallData.call_type === 'audio' ? 'voice' : 'video'} call...
          </p>
          <div className="flex justify-center gap-8">
            <button onClick={rejectCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110">
              <PhoneOff className="w-7 h-7" />
            </button>
            <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 animate-bounce">
              <PhoneIncoming className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CALLING / CONNECTED UI ──
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) {
    const remoteName = selectedUserRef.current?.name || incomingCallData?.caller_name || 'Unknown';
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        <div className="flex-1 relative bg-gray-900">
          {callType === 'video' ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4">
                  {remoteName.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-2xl font-semibold">{remoteName}</p>
              </div>
            </div>
          )}
          <div className="absolute top-6 left-0 right-0 text-center">
            <p className="text-white text-lg font-medium">
              {callState === CALL_STATE.CALLING ? 'Calling...' : remoteName}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {callState === CALL_STATE.CALLING ? `Ringing${callType === 'audio' ? ' (voice)' : ''}` : fmt(callDuration)}
            </p>
          </div>
          {callType === 'video' && (
            <div className="absolute top-20 right-4 w-32 h-44 rounded-xl overflow-hidden bg-gray-800 shadow-xl border-2 border-gray-700">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            </div>
          )}
          {/* Connection quality indicator */}
          {callState === CALL_STATE.CONNECTED && connectionQuality !== 'good' && (
            <div className={`absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
              connectionQuality === 'reconnecting' ? 'bg-yellow-500/80 text-black' : 'bg-red-500/80 text-white'
            }`}>
              {connectionQuality === 'reconnecting' ? 'Reconnecting...' : 'Poor connection'}
            </div>
          )}
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="bg-gray-900/90 backdrop-blur-sm py-6 px-4 safe-bottom">
          <div className="flex justify-center items-center gap-4">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {callType === 'video' && (
              <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`} title={isVideoOff ? 'Camera on' : 'Camera off'}>
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}
            {callType === 'video' && (
              <button onClick={flipCamera} className="w-14 h-14 rounded-full bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center transition-all" title="Flip camera">
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110" title="End call">
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE — show nothing (header renders its own buttons via ref) ──
  if (error) {
    return (
      <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm z-50">
        {error}
      </div>
    );
  }
  return null;
});

CallManager.displayName = 'CallManager';
export default CallManager;
