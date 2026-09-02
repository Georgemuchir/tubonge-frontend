import { useState, useEffect, useCallback } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeft, PhoneCall } from 'lucide-react';
import api, { resolveMediaUrl } from '../../services/api';
import socketService from '../../services/socket';
import Avatar from '../Avatar';

const CallLogs = ({ onBack, onCallback }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/calls/logs');
      console.log('[CallLogs] response:', res.status, res.data);
      setCalls(res.data.calls || []);
    } catch (e) {
      console.error('[CallLogs] fetch error:', e.response?.status, e.message);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Refresh when call events complete
  useEffect(() => {
    const sock = socketService.socket;
    if (!sock) return;
    const events = ['call_ended', 'missed_call', 'call_accepted', 'call_rejected', 'call_unavailable'];
    const handler = () => fetchLogs();
    events.forEach(ev => sock.on(ev, handler));
    return () => events.forEach(ev => sock.off(ev, handler));
  }, [fetchLogs]);

  const filtered = tab === 'missed' ? calls.filter(c => c.status === 'missed') : calls;

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

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-white">Calls</h2>
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <PhoneCall className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No call history yet</p>
            <p className="text-sm mt-1">Your calls will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((call) => {
              const isMissed = call.status === 'missed';
              return (
                <div
                  key={call.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => onCallback?.(call)}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallLogs;
