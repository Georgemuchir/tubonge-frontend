import React, { useEffect, useRef } from 'react';


export default function ChatWindow({ messages, onSend }) {
  const [text, setText] = React.useState("");
  const boxRef = useRef(null);
  const bottomRef = useRef(null);
  const [stickToBottom, setStickToBottom] = React.useState(true);

  useEffect(() => {
    if (stickToBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stickToBottom]);

  function onScroll() {
    const el = boxRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setStickToBottom(nearBottom);
  }

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div
        ref={boxRef}
        onScroll={onScroll}
        className="flex-1 p-4 overflow-y-auto bg-gray-800"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg ${msg.isSent ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t bg-gray-900 flex">
        <input
          className="flex-1 p-2 rounded-lg bg-gray-700 text-white mr-2"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
