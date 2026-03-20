import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, PhoneIncoming } from 'lucide-react';
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

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStateRef = useRef(callState);
  const selectedUserRef = useRef(selectedUser);
  const targetIdRef = useRef(null);
  const callTypeRef = useRef('video');
  const iceCandidateBuffer = useRef([]);

  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    console.log('[CALL] cleanup called');
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
  }, []);

  // ── Get user media ──
  const getMedia = useCallback(async (type) => {
    const constraints = {
      audio: true,
      video: type === 'video' ? { width: 640, height: 480, facingMode: 'user' } : false
    };
    console.log('[CALL] getUserMedia constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

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
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });

      peer.on('connect', () => {
        console.log('[CALL] Peer data channel connected');
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        setCallState(CALL_STATE.CONNECTED);
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
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      });

      peer.on('connect', () => {
        console.log('[CALL] Callee peer connected');
        setCallState(CALL_STATE.CONNECTED);
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
  }, [incomingCallData, currentUserId, getMedia, endCall]);

  // ── Reject incoming call ──
  const rejectCall = useCallback(() => {
    if (incomingCallData) {
      socketService.rejectCall(incomingCallData.caller_id, currentUserId);
    }
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [incomingCallData, currentUserId, cleanup]);

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

  // ── Expose startCall to parent via ref ──
  useImperativeHandle(ref, () => ({
    startCall,
  }), [startCall]);

  // ── Socket event listeners (register ONCE per userId) ──
  useEffect(() => {
    console.log('[CALL] Registering socket listeners, userId:', currentUserId);

    const handleIncomingCall = (data) => {
      console.log('[CALL] incoming_call event:', data.caller_name, data.call_type);
      if (callStateRef.current !== CALL_STATE.IDLE) {
        console.log('[CALL] Already in call, auto-rejecting');
        socketService.rejectCall(data.caller_id, currentUserId);
        return;
      }
      iceCandidateBuffer.current = [];
      setIncomingCallData(data);
      setCallState(CALL_STATE.INCOMING);
    };

    const handleCallAccepted = (data) => {
      console.log('[CALL] call_accepted event, signaling answer to peer');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      if (peerRef.current && data.signal_data) {
        peerRef.current.signal(data.signal_data);
      }
    };

    const handleCallRejected = () => {
      console.log('[CALL] call_rejected event');
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
      console.log('[CALL] call_ended event');
      setCallState(CALL_STATE.IDLE);
      setIncomingCallData(null);
      cleanup();
    };

    const handleCallUnavailable = (data) => {
      console.log('[CALL] call_unavailable:', data.reason);
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
      console.log('[CALL] ice_candidate received from', data.from_id);
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

    socketService.onIncomingCall(handleIncomingCall);
    socketService.onCallAccepted(handleCallAccepted);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onCallUnavailable(handleCallUnavailable);
    socketService.onIceCandidate(handleIceCandidate);

    return () => {
      socketService.off('incoming_call', handleIncomingCall);
      socketService.off('call_accepted', handleCallAccepted);
      socketService.off('call_rejected', handleCallRejected);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('call_unavailable', handleCallUnavailable);
      socketService.off('ice_candidate', handleIceCandidate);
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
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 w-80 text-center shadow-2xl border border-gray-700">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 animate-pulse">
            {incomingCallData.caller_name?.charAt(0)?.toUpperCase() || '?'}
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
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          )}
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="bg-gray-900/90 backdrop-blur-sm py-6 px-4">
          <div className="flex justify-center items-center gap-6">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {callType === 'video' && (
              <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110">
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
