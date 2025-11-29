import React from 'react';

export default function Message({ content, isSent }) {
  return (
    <div className={`px-4 py-2 rounded-lg mb-2 ${isSent ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>{content}</div>
  );
}
