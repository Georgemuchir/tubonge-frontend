import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export default function ChatDemo() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [socket, setSocket] = useState(null);

  // Register/login
  const handleAuth = async (type) => {
    const res = await fetch(`${API}/auth/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      setToken(data.token);
      // Connect socket
      const s = io(SOCKET_URL, { auth: { token: data.token } });
      s.on('new_message', (msg) => setMessages((m) => [...m, msg]));
      setSocket(s);
    }
  };

  // Fetch inbox
  const fetchInbox = async () => {
    const res = await fetch(`${API}/messages/inbox`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.inbox && data.inbox.length) {
      setConversationId(data.inbox[0].conversation_id);
    }
  };

  // Fetch messages
  useEffect(() => {
    if (!conversationId || !token) return;
    fetch(`${API}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));
  }, [conversationId, token]);

  // Send message
  const sendMessage = async () => {
    if (!message || !conversationId) return;
    await fetch(`${API}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ conversation_id: conversationId, content: message })
    });
    setMessage('');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Pinglo Chat Demo</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={() => handleAuth('register')}>Register</button>
      <button onClick={() => handleAuth('login')}>Login</button>
      <button onClick={fetchInbox}>Load Inbox</button>
      <div style={{ margin: '1rem 0', border: '1px solid #ccc', padding: '1rem', minHeight: 100 }}>
        {messages.map((m, i) => (
          <div key={i}><b>{m.sender_id}:</b> {m.content}</div>
        ))}
      </div>
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message" />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
