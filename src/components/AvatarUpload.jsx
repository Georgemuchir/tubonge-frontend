import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { usersAPI, resolveMediaUrl } from '../services/api';
import Avatar from './Avatar';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

// Self-contained profile-photo control: shows the current avatar, lets the
// user tap it to pick a new one, uploads it, and reports the new URL back.
// Owns its own file input, in-flight state, and error handling — nothing
// outside this component needs to know how the upload works.
const AvatarUpload = ({ name, avatarUrl, size = 96, fontSize, ringColor = '#ffffff', onUploaded }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickFile = () => {
    if (uploading) return;
    setError('');
    inputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, GIF, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image is too large (max 8MB).');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const { data } = await usersAPI.uploadAvatar(file);
      if (data?.avatar) {
        onUploaded?.(data.avatar);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed — try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={pickFile}
        title="Change profile photo"
        disabled={uploading}
        style={{ position: 'relative', padding: 0, border: 'none', background: 'none', cursor: uploading ? 'default' : 'pointer' }}
      >
        <Avatar
          name={name}
          avatarUrl={avatarUrl ? resolveMediaUrl(avatarUrl) : null}
          size={size}
          fontSize={fontSize}
          style={{ border: `4px solid ${ringColor}`, boxShadow: '0 6px 20px rgba(0,0,0,0.35)', opacity: uploading ? 0.5 : 1 }}
        />
        {uploading ? (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#ec4899)',
            border: `2px solid ${ringColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(168,85,247,0.6)',
          }}>
            <Camera style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
        )}
      </button>
      {error && <p className="text-xs text-red-400 text-center max-w-[220px]">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default AvatarUpload;
