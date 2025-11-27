import React from 'react';

export default function Inbox({ conversations, onSelect }) {
  return (
    <div className="w-1/3 h-full border-r bg-gray-900 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-4">Inbox</h2>
      {conversations.map(conv => (
        <div key={conv.id} className="p-3 mb-2 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer" onClick={() => onSelect(conv)}>
          <div className="font-semibold text-white">{conv.name}</div>
          <div className="text-gray-400 text-sm">{conv.lastMessage}</div>
        </div>
      ))}
    </div>
  );
}
