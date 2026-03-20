import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, PhoneIncoming } from 'lucide-react';
import Peer from 'simple-peer';
import socketService from '../../services/socket';

// ── Call States ──
const CALL_STATE = {
  IDLE: 'idle',
  CALLING: 'calling',        // outgoing ring
  INCOMING: 'incoming',      // incoming ring
  CONNECTED: 'connected',    // active call
};

const CallManager = ({ currentUser, selectedUser, onlineUsers }) => {
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callType, setCallType] = useState('video'); // 'audio' | 'video'
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
  const ringtoneRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStateRef = useRef(callState); // track callState in refs for callbacks

  const currentUserId = currentUser?.id || currentUser?._id;

  // Keep callState ref in sync for use inside peer callbacks
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) { /* ignore */ }
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
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setError('');
  }, []);

  // ── Get user media ──
  const getMedia = useCallback(async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 640, height: 480, facingMode: 'user' } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Media access error:', err);
      setError(err.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied'
        : 'Could not access camera/microphone');
      throw err;
    }
  }, []);

  // ── Start a call (caller) ──
  const startCall = useCallback(async (type) => {
    console.log('[CALL] startCall called, type:', type, 'selectedUser:', selectedUser?.name, 'callState:', callState);
    if (!selectedUser || callState !== CALL_STATE.IDLE) return;

    const targetId = selectedUser.id || selectedUser._id;
    console.log('[CALL] targetId:', targetId);

    try {
      setCallType(type);
      setCallState(CALL_STATE.CALLING);
      setError('');

      console.log('[CALL] Getting media...');
      const stream = await getMedia(type);
      console.log('[CALL] Got media stream, tracks:', stream.getTracks().map(t => t.kind));
      
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

      peer.on('signal', (signalData) => {
        console.log('[CALL] Peer signal generated, type:', signalData.type || 'candidate', 'sending to:', targetId);
        socketService.callUser(currentUserId, targetId, signalData, type);
      });

      peer.on('stream', (remoteStream) => {
        console.log('[CALL] Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        console.log('[CALL] Peer connected!');
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        setCallState(CALL_STATE.CONNECTED);
        callTimerRef.current = setInterval(() => {
          setCallDuration(d => d + 1);
        }, 1000);
      });

      peer.on('close', () => {
        console.log('[CALL] Peer closed, current state:', callStateRef.current);
        // Only end call if we were connected — during CALLING, ignore close
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          endCall();
        }
      });

      peer.on('error', (err) => {
        console.error('[CALL] Peer error:', err.message, 'state:', callStateRef.current);
        // During CALLING state, don't kill the UI — server-side call_unavailable will handle it
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          setError('Connection lost');
          endCall();
        }
        // During CALLING, just log — keep ringing
      });

      peerRef.current = peer;

      // 30-second timeout for unanswered calls
      callTimeoutRef.current = setTimeout(() => {
        console.log('[CALL] Call timeout — no answer');
        if (callStateRef.current === CALL_STATE.CALLING) {
          setError('No answer');
          socketService.endCall(currentUserId, targetId, currentUserId);
          // Record missed call so callee sees it
          socketService.missedCall(currentUserId, targetId, type);
          setCallState(CALL_STATE.IDLE);
          cleanup();
          setTimeout(() => setError(''), 3000);
        }
      }, 30000);

    } catch (err) {
      console.error('[CALL] startCall error:', err);
      setError(err.name === 'NotAllowedError' ? 'Microphone/camera permission denied' : 'Failed to start call');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    }
  }, [selectedUser, callState, currentUserId, getMedia, cleanup]);

  // ── Accept incoming call ──
  const acceptCall = useCallback(async () => {
    console.log('[CALL] acceptCall called, incomingCallData:', incomingCallData?.caller_name);
    if (!incomingCallData) return;

    try {
      const type = incomingCallData.call_type || 'video';
      setCallType(type);

      console.log('[CALL] Callee getting media...');
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

      peer.on('signal', (signalData) => {
        console.log('[CALL] Callee signal generated, type:', signalData.type || 'candidate');
        socketService.acceptCall(
          incomingCallData.caller_id,
          currentUserId,
          signalData
        );
      });

      peer.on('stream', (remoteStream) => {
        console.log('[CALL] Callee received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      peer.on('connect', () => {
        console.log('[CALL] Callee peer connected!');
        setCallState(CALL_STATE.CONNECTED);
        callTimerRef.current = setInterval(() => {
          setCallDuration(d => d + 1);
        }, 1000);
      });

      peer.on('close', () => {
        console.log('[CALL] Callee peer closed, state:', callStateRef.current);
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          endCall();
        }
      });

      peer.on('error', (err) => {
        console.error('[CALL] Callee peer error:', err.message, 'state:', callStateRef.current);
        if (callStateRef.current === CALL_STATE.CONNECTED) {
          setError('Connection lost');
          endCall();
        }
      });

      // Signal the incoming offer to our peer
      peer.signal(incomingCallData.signal_data);
      peerRef.current = peer;
      setCallState(CALL_STATE.CONNECTED);
    } catch (err) {
      console.error('[CALL] acceptCall error:', err);
      rejectCall();
    }
  }, [incomingCallData, currentUserId, getMedia]);

  // ── Reject incoming call ──
  const rejectCall = useCallback(() => {
    if (incomingCallData) {
      socketService.rejectCall(incomingCallData.caller_id, currentUserId);
    }
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [incomingCallData, currentUserId, cleanup]);

  // ── End active call ──
  const endCall = useCallback(() => {
    const targetId = selectedUser?.id || selectedUser?._id || incomingCallData?.caller_id;
    const wasCalling = callStateRef.current === CALL_STATE.CALLING;

    if (targetId) {
      socketService.endCall(
        incomingCallData ? incomingCallData.caller_id : currentUserId,
        incomingCallData ? currentUserId : targetId,
        currentUserId
      );

      // If caller hangs up while still ringing → missed call
      if (wasCalling && !incomingCallData) {
        socketService.missedCall(currentUserId, targetId, callType);
      }
    }
    setIncomingCallData(null);
    setCallState(CALL_STATE.IDLE);
    cleanup();
  }, [selectedUser, incomingCallData, currentUserId, callType, cleanup]);

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // ── Toggle video ──
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  // ── Socket event listeners ──
  useEffect(() => {
    const handleIncomingCall = (data) => {
      console.log('[CALL] Incoming call received:', data);
      if (callState !== CALL_STATE.IDLE) {
        // Already in a call, auto-reject
        socketService.rejectCall(data.caller_id, currentUserId);
        return;
      }
      setIncomingCallData(data);
      setCallState(CALL_STATE.INCOMING);
    };

    const handleCallAccepted = (data) => {
      console.log('[CALL] Call accepted:', data);
      // Clear the ringing timeout
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      if (peerRef.current && data.signal_data) {
        peerRef.current.signal(data.signal_data);
      }
    };

    const handleCallRejected = () => {
      console.log('[CALL] Call rejected');
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
      console.log('[CALL] Call ended');
      setCallState(CALL_STATE.IDLE);
      setIncomingCallData(null);
      cleanup();
    };

    const handleCallUnavailable = (data) => {
      console.log('[CALL] Call unavailable:', data);
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      setError(data.reason || 'User unavailable');
      setCallState(CALL_STATE.IDLE);
      cleanup();
      setTimeout(() => setError(''), 3000);
    };

    socketService.onIncomingCall(handleIncomingCall);
    socketService.onCallAccepted(handleCallAccepted);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallEnded(handleCallEnded);
    socketService.onCallUnavailable(handleCallUnavailable);

    return () => {
      socketService.off('incoming_call', handleIncomingCall);
      socketService.off('call_accepted', handleCallAccepted);
      socketService.off('call_rejected', handleCallRejected);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('call_unavailable', handleCallUnavailable);
    };
  }, [callState, currentUserId, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ── Format duration ──
  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Incoming call UI ──
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
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 animate-bounce"
            >
              <PhoneIncoming className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active call / Calling UI ──
  if (callState === CALL_STATE.CALLING || callState === CALL_STATE.CONNECTED) {
    const remoteName = selectedUser?.name || incomingCallData?.caller_name || 'Unknown';

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        {/* Remote video (full screen) */}
        <div className="flex-1 relative bg-gray-900">
          {callType === 'video' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
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

          {/* Status overlay */}
          <div className="absolute top-6 left-0 right-0 text-center">
            <p className="text-white text-lg font-medium">
              {callState === CALL_STATE.CALLING ? 'Calling...' : remoteName}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {callState === CALL_STATE.CALLING
                ? `Ringing${callType === 'audio' ? ' (voice)' : ''}`
                : formatDuration(callDuration)}
            </p>
          </div>

          {/* Local video (picture-in-picture) */}
          {callType === 'video' && (
            <div className="absolute top-20 right-4 w-32 h-44 rounded-xl overflow-hidden bg-gray-800 shadow-xl border-2 border-gray-700">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="bg-gray-900/90 backdrop-blur-sm py-6 px-4">
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Call buttons (shown in chat header) ──
  return (
    <>
      {error && (
        <div className="absolute top-16 right-4 bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-sm z-50 animate-fadeIn">
          {error}
        </div>
      )}
      <button
        onClick={() => startCall('audio')}
        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-colors touch-target"
        title="Voice Call"
      >
        <Phone className="w-5 h-5" />
      </button>
      <button
        onClick={() => startCall('video')}
        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-colors touch-target"
        title="Video Call"
      >
        <Video className="w-5 h-5" />
      </button>
    </>
  );
};

export default CallManager;
