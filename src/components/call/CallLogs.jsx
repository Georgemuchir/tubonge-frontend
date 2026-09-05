import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeft, PhoneCall, RefreshCw, AlertCircle } from 'lucide-react';
import api, { resolveMediaUrl } from '../../services/api';
import socketService from '../../services/socket';
import Avatar from '../Avatar';

// Backend event that fires to *both* parties whenever a call_logs record
// actually changes (answered/declined/ended/missed) — see socket_events.py's
// _notify_call_log_updated. Kept alongside the raw WebRTC signaling events
// for redundancy, but those only ever reach whichever party didn't perform
// the action (call_ended etc. is never echoed back to whoever hung up).
const REFRESH_EVENTS = ['call_log_updated', 'call_ended', 'call_accepted', 'call_rejected', 'call_unavailable'];

const fmtDuration = (sec) => {
  if (!sec || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

const StatusIcon = ({ call }) => {
  if (call.status === 'missed') return <PhoneMissed className="w-4 h-4 text-red-400" />;
  if (call.is_outgoing) return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
  return <PhoneIncoming className="w-4 h-4 text-green-400" />;
};

const CallRow = ({ call, onClick }) => {
  const isMissed = call.status === 'missed';
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <Avatar
        name={call.other_user_name}
        avatarUrl={call.other_user_avatar ? resolveMediaUrl(call.other_user_avatar) : null}
        size={48}
        fontSize={18}
      />

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isMissed ? 'text-red-400' : 'text-white'}`}>
          {call.other_user_name || 'Unknown'}
        </p>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <StatusIcon call={call} />
          <span>{call.is_outgoing ? 'Outgoing' : 'Incoming'}</span>
          {(call.status === 'answered' || call.status === 'ended') && call.duration > 0 && (
            <span className="text-gray-500">· {fmtDuration(call.duration)}</span>
          )}
          {call.status === 'declined' && <span className="text-gray-500">· Declined</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-500">{fmtTime(call.created_at)}</span>
        {call.call_type === 'audio'
          ? <Phone className="w-5 h-5 text-gray-400" />
          : <Video className="w-5 h-5 text-gray-400" />
        }
      </div>
    </div>
  );
};

const CallLogs = ({ onBack, onCallback }) => {
  const [calls, setCalls] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('all');
  const requestIdRef = useRef(0);

  const fetchLogs = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++requestIdRef.current;
    if (silent) setRefreshing(true); else setStatus('loading');
    try {
      const res = await api.get('/calls/logs');
      if (requestId !== requestIdRef.current) return; // a newer request already superseded this one
      setCalls(res.data.calls || []);
      setStatus('ready');
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      console.error('[CallLogs] fetch failed:', e.response?.status, e.message);
      setStatus('error');
    } finally {
      if (requestId === requestIdRef.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live refresh on call events. socketService connects once, early, at
  // login — well before a user could reach this screen — but guard against
  // the (rare) case of landing here before that finishes by polling briefly
  // for the socket to exist rather than silently never subscribing.
  useEffect(() => {
    let sock = socketService.socket;
    let pollTimer = null;
    const handler = () => fetchLogs({ silent: true });

    const attach = (s) => s && REFRESH_EVENTS.forEach(ev => s.on(ev, handler));
    const detach = (s) => s && REFRESH_EVENTS.forEach(ev => s.off(ev, handler));

    if (sock) {
      attach(sock);
    } else {
      let attempts = 0;
      pollTimer = setInterval(() => {
        attempts += 1;
        sock = socketService.socket;
        if (sock) {
          attach(sock);
          clearInterval(pollTimer);
        } else if (attempts >= 10) {
          clearInterval(pollTimer); // give up after ~5s; manual refresh still works
        }
      }, 500);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      detach(sock);
    };
  }, [fetchLogs]);

  const filtered = useMemo(
    () => (tab === 'missed' ? calls.filter(c => c.status === 'missed') : calls),
    [calls, tab]
  );

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-white flex-1">Calls</h2>
          <button
            onClick={() => fetchLogs({ silent: true })}
            disabled={refreshing || status === 'loading'}
            title="Refresh"
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-2">
          {['all', 'missed'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? t === 'missed' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {t === 'all' ? 'All' : 'Missed'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {status === 'loading' ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 px-6 text-center">
            <AlertCircle className="w-16 h-16 mb-4 opacity-30 text-red-400" />
            <p className="text-lg font-medium text-gray-300">Couldn't load your calls</p>
            <p className="text-sm mt-1">Check your connection and try again</p>
            <button
              onClick={() => fetchLogs()}
              className="mt-4 px-4 py-2 rounded-full text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <PhoneCall className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">{tab === 'missed' ? 'No missed calls' : 'No call history yet'}</p>
            <p className="text-sm mt-1">Your calls will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((call) => (
              <CallRow key={call.id} call={call} onClick={() => onCallback?.(call)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallLogs;
