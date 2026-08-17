import { useState } from 'react';

const AVATAR_COLORS = ['#ec4899', '#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#818cf8'];

export const getAvatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// Renders a user's photo, falling back to a colored initial if the URL 404s
// (e.g. an avatar record survives but the underlying file was lost) instead
// of showing the browser's broken-image icon.
const Avatar = ({ name, avatarUrl, size = 44, color, style, fontSize }) => {
  const [broken, setBroken] = useState(false);
  const bg = color || getAvatarColor(name);
  const showImg = avatarUrl && !broken;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg}cc, ${bg}55)`,
        border: `1.5px solid ${bg}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: fontSize || size * 0.36, color: '#fff', overflow: 'hidden', flexShrink: 0,
        boxShadow: `0 0 10px ${bg}33`,
        ...style,
      }}
    >
      {showImg ? (
        <img
          src={avatarUrl}
          alt={name || ''}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        name?.charAt(0)?.toUpperCase() || '?'
      )}
    </div>
  );
};

export default Avatar;
