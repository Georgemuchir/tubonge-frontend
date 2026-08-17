import { useState, useEffect } from 'react';
import { X, ImageIcon, Mic, Link, ShieldOff, ShieldCheck, Phone, Trash2 } from 'lucide-react';
import { messagesAPI, usersAPI, resolveMediaUrl } from '../../services/api';

const resolveUrl = resolveMediaUrl;

const TABS = [
  { key: 'Photos', icon: ImageIcon },
  { key: 'Voice', icon: Mic },
  { key: 'Links', icon: Link },
];

const ContactProfilePanel = ({ participant, onClose, onBlockStatusChange, onDelete }) => {
  const [activeTab, setActiveTab] = useState('Photos');
  const [media, setMedia] = useState({ images: [], voices: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!participant?.id) return;
    setAvatarBroken(false);
    setLoading(true);
    Promise.all([
      messagesAPI.getSharedMedia(participant.id),
      messagesAPI.getChatStatus(participant.id),
      usersAPI.getPublicProfile(participant.id),
    ]).then(([mediaRes, statusRes, profileRes]) => {
      setMedia(mediaRes.data);
      setIsBlocked(statusRes.data?.status === 'BLOCKED');
      setPhoneNumber(profileRes.data?.phone_number || '');
    }).catch(() => setMedia({ images: [], voices: [], links: [] }))
      .finally(() => setLoading(false));
  }, [participant?.id]);

  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await usersAPI.unblockUser(participant.id);
        setIsBlocked(false);
        onBlockStatusChange?.('ACCEPTED');
      } else {
        await usersAPI.blockUser(participant.id);
        setIsBlocked(true);
        onBlockStatusChange?.('BLOCKED');
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleteLoading(true);
    try {
      await messagesAPI.deleteConversation(participant.id);
      onDelete?.();
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  const avatarSrc = participant.avatar && !avatarBroken ? resolveUrl(participant.avatar) : null;

  const items =
    activeTab === 'Photos' ? media.images
    : activeTab === 'Voice' ? media.voices
    : media.links;

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={lightboxSrc}
            alt="profile"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: '50%', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 340,
          background: '#0c1324',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          zIndex: 50,
          animation: 'slideInRight 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 0 }}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 15 }}>Contact Info</span>
        </div>

        {/* Profile section */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '12px 16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Clickable avatar */}
          <div
            onClick={() => avatarSrc && setLightboxSrc(avatarSrc)}
            style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', marginBottom: 12,
              border: '2px solid rgba(16,185,129,0.3)',
              flexShrink: 0,
              cursor: avatarSrc ? 'zoom-in' : 'default',
              transition: 'opacity 0.15s',
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={participant.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 30 }}>
                {participant.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          <div style={{ color: '#f3f4f6', fontWeight: 700, fontSize: 18, marginBottom: 3 }}>
            {participant.name || 'Unknown'}
          </div>
          {participant.username && (
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>@{participant.username}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: phoneNumber ? 14 : 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: participant.status === 'online' ? '#10b981' : '#4b5563',
            }} />
            <span style={{ fontSize: 12, color: participant.status === 'online' ? '#10b981' : '#6b7280' }}>
              {participant.status === 'online' ? 'Active now' : 'Offline'}
            </span>
          </div>

          {/* Phone number */}
          {phoneNumber && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 4,
            }}>
              <Phone style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }} />
              <span style={{ color: '#d1d5db', fontSize: 14 }}>{phoneNumber}</span>
            </div>
          )}

          {/* Block / Unblock */}
          <button
            onClick={handleBlock}
            disabled={blockLoading}
            style={{
              marginTop: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 20,
              border: `1px solid ${isBlocked ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              background: isBlocked ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              color: isBlocked ? '#10b981' : '#ef4444',
              cursor: blockLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500,
              opacity: blockLoading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {isBlocked
              ? <><ShieldCheck style={{ width: 15, height: 15 }} /> Unblock</>
              : <><ShieldOff style={{ width: 15, height: 15 }} /> Block</>
            }
          </button>

          {/* Delete conversation */}
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            style={{
              marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 20px', borderRadius: 20,
              border: '1px solid rgba(239,68,68,0.4)',
              background: confirmDelete ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.06)',
              color: '#ef4444',
              cursor: deleteLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500,
              opacity: deleteLoading ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
          >
            <Trash2 style={{ width: 15, height: 15 }} />
            {confirmDelete ? 'Tap again to confirm' : 'Delete chat'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(({ key }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: '11px 0', border: 'none', background: 'none',
                color: activeTab === key ? '#10b981' : '#6b7280',
                fontSize: 13, fontWeight: activeTab === key ? 600 : 400,
                cursor: 'pointer',
                borderBottom: activeTab === key ? '2px solid #10b981' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40, color: '#6b7280', fontSize: 13 }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : activeTab === 'Photos' ? (
            <PhotoGrid items={items} onOpen={setLightboxSrc} />
          ) : activeTab === 'Voice' ? (
            <VoiceList items={items} />
          ) : (
            <LinkList items={items} />
          )}
        </div>
      </div>
    </>
  );
};

const EmptyState = ({ tab }) => {
  const Icon = TABS.find(t => t.key === tab)?.icon || ImageIcon;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 56, color: '#374151', gap: 10 }}>
      <Icon style={{ width: 40, height: 40 }} />
      <span style={{ fontSize: 13, color: '#6b7280' }}>No {tab.toLowerCase()} shared yet</span>
    </div>
  );
};

const PhotoGrid = ({ items, onOpen }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
    {items.map((item, i) => (
      <button
        key={i}
        onClick={() => onOpen(resolveUrl(item.url))}
        style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', borderRadius: 6, border: 'none', padding: 0, cursor: 'zoom-in' }}
      >
        <img
          src={resolveUrl(item.url)}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </button>
    ))}
  </div>
);

const VoiceList = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {items.map((item, i) => (
      <div key={i} style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <audio controls src={resolveUrl(item.url)} style={{ width: '100%', height: 36 }} preload="metadata" />
        {item.timestamp && (
          <div style={{ color: '#4b5563', fontSize: 11, marginTop: 5 }}>
            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>
    ))}
  </div>
);

const LinkList = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {items.map((item, i) => (
      <a
        key={i}
        href={item.url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'block', padding: '10px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
          color: '#10b981', fontSize: 12,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: 'none',
        }}
      >
        {item.url}
      </a>
    ))}
  </div>
);

export default ContactProfilePanel;
