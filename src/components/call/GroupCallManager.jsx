import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users, Phone, X, Check, ScreenShare, ScreenShareOff } from 'lucide-react';
import Peer from 'simple-peer/simplepeer.min.js';
import socketService from '../../services/socket';

const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const makeRoomId = () => `gc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getAvatarColor = (name = '') => {
  const colors = ['bg-teal-600','bg-indigo-600','bg-purple-600','bg-pink-600','bg-orange-600','bg-cyan-600'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
};

// ── Single participant tile ──────────────────────────────────────────────────
const Tile = ({ participant, localVideoRef, isLocal, isScreenSharing }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = isLocal ? localVideoRef?.current : videoRef.current;
    if (!el || !participant.stream) return;
    el.srcObject = participant.stream;
    el.muted = isLocal;
    el.play().catch(() => { if (el) { el.muted = true; el.play().catch(() => {}); } });
  }, [participant.stream, isLocal, localVideoRef]);

  const letter = (participant.name || '?').charAt(0).toUpperCase();
  const color = getAvatarColor(participant.name);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[120px]">
      {participant.stream && participant.callType === 'video' ? (
        isLocal
          ? <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={isScreenSharing ? {} : { transform: 'scaleX(-1)' }} />
          : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center text-white text-2xl font-bold`}>
          {letter}
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <p className="text-white text-xs font-medium truncate">
          {isLocal ? 'You' : participant.name || 'Connecting…'}
        </p>
      </div>
      {!participant.stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/60">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// ── Invite modal ─────────────────────────────────────────────────────────────
const InviteModal = ({ contacts, onStart, onClose }) => {
  const [selected, setSelected] = useState([]);
  const [callType, setCallType] = useState('video');

  const toggle = (c) => {
    const id = c.id || c._id;
    setSelected(prev =>
      prev.find(p => (p.id || p._id) === id)
        ? prev.filter(p => (p.id || p._id) !== id)
        : prev.length < 4 ? [...prev, c] : prev
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span className="text-white font-semibold">New Group Call</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Call type toggle */}
        <div className="flex gap-2 p-4 pb-2">
          {['video', 'audio'].map(t => (
            <button
              key={t}
              onClick={() => setCallType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${callType === t ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {t === 'video' ? '📹 Video' : '🎤 Audio'}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 px-4 pb-2">Select up to 4 people</p>

        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No contacts yet</p>
          ) : contacts.map(c => {
            const id = c.id || c._id;
            const isSelected = selected.some(s => (s.id || s._id) === id);
            return (
              <button
                key={id}
                onClick={() => toggle(c)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${isSelected ? 'bg-teal-600/20 border border-teal-500/40' : 'hover:bg-gray-700'}`}
              >
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(c.name)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden`}>
                  {c.avatar
                    ? <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    : c.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-sm font-medium truncate">{c.name}</p>
                  {c.username && <p className="text-gray-400 text-xs">@{c.username}</p>}
                </div>
                {isSelected && <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => selected.length > 0 && onStart(callType, selected)}
            disabled={selected.length === 0}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Start call with {selected.length > 0 ? `${selected.length} person${selected.length > 1 ? 's' : ''}` : '…'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const GroupCallManager = forwardRef(({ currentUser, contacts = [] }, ref) => {
  const [phase, setPhase] = useState('idle'); // idle | invite | incoming | active
  const [callType, setCallType] = useState('video');
  const [roomId, setRoomId] = useState('');
  const [incomingData, setIncomingData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);

  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const screenTrackRef = useRef(null);
  const roomIdRef = useRef('');
  const phaseRef = useRef('idle');
  const timerRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  const currentUserId = currentUser?.id || currentUser?._id;

  // ── cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    peersRef.current.forEach(p => { try { p.destroy(); } catch {} });
    peersRef.current.clear();
    if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setParticipants([]);
    setDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setPhase('idle');
    setRoomId('');
  }, []);

  // ── get local media ────────────────────────────────────────────────────────
  const getMedia = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  // ── create peer ────────────────────────────────────────────────────────────
  const createPeer = useCallback((targetId, initiator, stream) => {
    const rid = roomIdRef.current;
    const peer = new Peer({ initiator, trickle: true, stream, config: { iceServers: ICE } });

    peer.on('signal', sig => {
      socketService.sendGroupSignal(rid, targetId, currentUserId, sig);
    });

    peer.on('stream', remoteStream => {
      setParticipants(prev =>
        prev.map(p => p.userId === targetId ? { ...p, stream: remoteStream, callType } : p)
      );
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
    });

    peer.on('close', () => {
      peersRef.current.delete(targetId);
      setParticipants(prev => prev.filter(p => p.userId !== targetId));
    });

    peer.on('error', () => {
      peersRef.current.delete(targetId);
      setParticipants(prev => prev.filter(p => p.userId !== targetId));
    });

    peersRef.current.set(targetId, peer);
    return peer;
  }, [currentUserId, callType]);

  // ── socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const onInvite = (data) => {
      if (phaseRef.current !== 'idle') return;
      setIncomingData(data);
      setPhase('incoming');
    };

    const onPeers = ({ peers }) => {
      if (!localStreamRef.current) return;
      peers.forEach(({ user_id }) => {
        if (user_id === currentUserId || peersRef.current.has(user_id)) return;
        createPeer(user_id, true, localStreamRef.current);
      });
    };

    const onPeerJoined = ({ user_id, user_name, user_avatar }) => {
      if (user_id === currentUserId) return;
      setParticipants(prev => {
        if (prev.find(p => p.userId === user_id)) return prev;
        return [...prev, { userId: user_id, name: user_name, avatar: user_avatar, stream: null }];
      });
      if (localStreamRef.current && !peersRef.current.has(user_id)) {
        createPeer(user_id, true, localStreamRef.current);
      }
    };

    const onPeerLeft = ({ user_id }) => {
      const peer = peersRef.current.get(user_id);
      if (peer) { try { peer.destroy(); } catch {} peersRef.current.delete(user_id); }
      setParticipants(prev => prev.filter(p => p.userId !== user_id));
    };

    const onSignal = ({ from_id, signal }) => {
      let peer = peersRef.current.get(from_id);
      if (!peer && localStreamRef.current) {
        peer = createPeer(from_id, false, localStreamRef.current);
        setParticipants(prev => {
          if (prev.find(p => p.userId === from_id)) return prev;
          return [...prev, { userId: from_id, name: '', avatar: '', stream: null }];
        });
      }
      if (peer && !peer.destroyed) { try { peer.signal(signal); } catch {} }
    };

    socket.on('group_call_invite',  onInvite);
    socket.on('group_call_peers',   onPeers);
    socket.on('group_peer_joined',  onPeerJoined);
    socket.on('group_peer_left',    onPeerLeft);
    socket.on('group_call_signal',  onSignal);

    return () => {
      socket.off('group_call_invite',  onInvite);
      socket.off('group_call_peers',   onPeers);
      socket.off('group_peer_joined',  onPeerJoined);
      socket.off('group_peer_left',    onPeerLeft);
      socket.off('group_call_signal',  onSignal);
    };
  }, [currentUserId, createPeer]);

  // ── start (host) ───────────────────────────────────────────────────────────
  const startGroupCall = useCallback(async (type, invitees) => {
    try {
      const rid = makeRoomId();
      setRoomId(rid);
      roomIdRef.current = rid;
      setCallType(type);
      const stream = await getMedia(type);
      setParticipants([{
        userId: currentUserId,
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '',
        stream,
        isLocal: true,
        callType: type,
      }]);
      setPhase('active');
      socketService.createGroupCall(
        rid,
        invitees.map(u => u.id || u._id),
        type,
        currentUserId,
        currentUser?.name || '',
        currentUser?.avatar || '',
      );
    } catch { cleanup(); }
  }, [currentUserId, currentUser, getMedia, cleanup]);

  // ── accept invite ──────────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingData) return;
    try {
      const { room_id, call_type, caller_id, caller_name, caller_avatar } = incomingData;
      setRoomId(room_id);
      roomIdRef.current = room_id;
      setCallType(call_type);
      setParticipants([
        { userId: currentUserId, name: currentUser?.name || 'You', avatar: currentUser?.avatar || '', isLocal: true, stream: null, callType: call_type },
        { userId: caller_id, name: caller_name, avatar: caller_avatar, stream: null, callType: call_type },
      ]);
      setPhase('active');
      const stream = await getMedia(call_type);
      setParticipants(prev => prev.map(p => p.isLocal ? { ...p, stream } : p));
      socketService.joinGroupCall(room_id, currentUserId, currentUser?.name || '', currentUser?.avatar || '');
      setIncomingData(null);
    } catch { declineCall(); }
  }, [incomingData, currentUserId, currentUser, getMedia]);

  // ── decline / leave ────────────────────────────────────────────────────────
  const declineCall = useCallback(() => {
    if (incomingData) socketService.leaveGroupCall(incomingData.room_id, currentUserId);
    setIncomingData(null);
    setPhase('idle');
  }, [incomingData, currentUserId]);

  const leaveCall = useCallback(() => {
    socketService.leaveGroupCall(roomIdRef.current, currentUserId);
    cleanup();
  }, [currentUserId, cleanup]);

  // ── controls ───────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  }, []);

  const toggleVideo = useCallback(() => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current = null; }
    setIsScreenSharing(false);
    if (!localStreamRef.current) return;
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const camTrack = camStream.getVideoTracks()[0];
      peersRef.current.forEach(peer => {
        const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(camTrack).catch(() => {});
      });
      localStreamRef.current.getVideoTracks().forEach(t => { localStreamRef.current.removeTrack(t); t.stop(); });
      localStreamRef.current.addTrack(camTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    } catch {}
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;
    if (isScreenSharing) { stopScreenShare(); return; }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      peersRef.current.forEach(peer => {
        const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      });
      localStreamRef.current.getVideoTracks().forEach(t => { localStreamRef.current.removeTrack(t); });
      localStreamRef.current.addTrack(screenTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(true);
      screenTrack.addEventListener('ended', stopScreenShare, { once: true });
    } catch (e) {
      if (e.name !== 'NotAllowedError') console.error('[GROUP CALL] Screen share failed:', e.message);
    }
  }, [isScreenSharing, stopScreenShare]);

  // Expose startGroupCall + open invite
  useImperativeHandle(ref, () => ({
    startGroupCall,
    openInvite: () => setPhase('invite'),
  }), [startGroupCall]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── INVITE MODAL ───────────────────────────────────────────────────────────
  if (phase === 'invite') {
    return (
      <InviteModal
        contacts={contacts}
        onStart={(type, invitees) => { startGroupCall(type, invitees); }}
        onClose={() => setPhase('idle')}
      />
    );
  }

  // ── INCOMING ──────────────────────────────────────────────────────────────
  if (phase === 'incoming' && incomingData) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 w-72 text-center shadow-2xl">
          <div className={`w-20 h-20 rounded-full ${getAvatarColor(incomingData.caller_name)} flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4`}>
            {incomingData.caller_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h3 className="text-xl font-semibold text-white mb-1">{incomingData.caller_name}</h3>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-teal-400" />
            <p className="text-teal-400 text-sm font-medium">Group {incomingData.call_type} call</p>
          </div>
          <p className="text-gray-400 text-xs mb-8">Inviting you to join</p>
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={declineCall} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all active:scale-95">
                <PhoneOff className="w-6 h-6" />
              </button>
              <span className="text-xs text-gray-500">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-all active:scale-95">
                <Phone className="w-6 h-6" />
              </button>
              <span className="text-xs text-gray-500">Join</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE CALL ───────────────────────────────────────────────────────────
  if (phase === 'active') {
    const localParticipant = participants.find(p => p.isLocal);
    const remoteParticipants = participants.filter(p => !p.isLocal);
    const total = participants.length;
    const cols = total <= 2 ? 'grid-cols-1' : total <= 4 ? 'grid-cols-2' : 'grid-cols-3';

    return (
      <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <span className="text-white font-semibold text-sm">Group Call</span>
            <span className="text-gray-400 text-xs">· {total} joined</span>
          </div>
          {duration > 0 && <span className="text-teal-400 font-mono text-sm">{fmt(duration)}</span>}
        </div>

        {/* Tile grid */}
        <div className={`flex-1 grid ${cols} gap-2 p-2 overflow-hidden`}>
          {/* Local tile */}
          {localParticipant && (
            <Tile
              key="local"
              participant={{ ...localParticipant, callType }}
              localVideoRef={localVideoRef}
              isLocal
              isScreenSharing={isScreenSharing}
            />
          )}
          {/* Remote tiles */}
          {remoteParticipants.map(p => (
            <Tile key={p.userId} participant={{ ...p, callType }} isLocal={false} />
          ))}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-center items-center gap-5 safe-area-bottom">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isVideoOff ? 'bg-white text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}
          {callType === 'video' && (
            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isScreenSharing ? 'bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            >
              {isScreenSharing ? <ScreenShareOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
            </button>
          )}
          <button
            onClick={leaveCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all active:scale-95"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  return null;
});

GroupCallManager.displayName = 'GroupCallManager';
export default GroupCallManager;
