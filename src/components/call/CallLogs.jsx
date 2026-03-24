import React, { useState, useEffect, useCallback } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeft, PhoneCall } from 'lucide-react';
import api from '../../services/api';
import socketService from '../../services/socket';

const CallLogs = ({ onBack, onCallback, getAvatarColor }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // 'all' | 'missed'

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/calls/logs');
      setCalls(res.data.calls || []);
    } catch (e) {
      console.error('Failed to fetch call logs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Re-fetch when any call event completes so the list stays current
  useEffect(() => {
    const events = ['call_ended', 'missed_call', 'call_accepted', 'call_rejected', 'call_declined'];
    events.forEach(ev => socketService.on(ev, fetchLogs));
    return () => events.forEach(ev => socketService.off(ev, fetchLogs));
  }, [fetchLogs]);

  const filtered = tab === 'missed' ? calls.filter(c => c.status === 'missed') : calls;

  const fmtDuration = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays === 0) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return d.toLocaleDateString([], { weekday: 'short' });
      } else {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getStatusIcon = (call) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-400" />;
    }
    if (call.is_outgoing) {
      return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
    }
    return <PhoneIncoming className="w-4 h-4 text-green-400" />;
  };

  const getCallTypeIcon = (call) => {
    if (call.call_type === 'audio') {
      return <Phone className="w-5 h-5 text-gray-400" />;
    }
    return <Video className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-white">Calls</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab('missed')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'missed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Missed
          </button>
        </div>
      </div>

      {/* Call list */}
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
              const avatarColor = getAvatarColor?.(call.other_user_name) || 'from-blue-500 to-purple-600';

              return (
                <div
                  key={call.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => onCallback?.(call)}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {call.other_user_avatar ? (
                      <img
                        src={call.other_user_avatar}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      call.other_user_name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isMissed ? 'text-red-400' : 'text-white'}`}>
                      {call.other_user_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      {getStatusIcon(call)}
                      <span>{call.is_outgoing ? 'Outgoing' : 'Incoming'}</span>
                      {call.status === 'answered' && call.duration > 0 && (
                        <span className="text-gray-500">· {fmtDuration(call.duration)}</span>
                      )}
                      {call.status === 'declined' && (
                        <span className="text-gray-500">· Declined</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500">{fmtTime(call.created_at)}</span>
                    {getCallTypeIcon(call)}
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
