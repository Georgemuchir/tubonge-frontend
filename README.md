# Pinglo Frontend

A modern, real-time messaging web application built with React, Tailwind CSS, and Socket.IO for seamless communication.

## 🚀 Features

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Messaging**: Instant message delivery with Socket.IO
- **User Authentication**: Secure JWT-based authentication
- **Live Typing Indicators**: See when others are typing
- **Online Status**: Real-time user presence tracking
- **Message Status**: Read receipts and delivery confirmation
- **User Search**: Find and start conversations with other users
- **Responsive Design**: Works perfectly on desktop and mobile

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 3
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **UI Components**: Headless UI

## 📦 Installation

1. **Clone and navigate to the frontend directory:**
   ```bash
   cd pinglo-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URL configuration
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```bash
# Backend API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration  
VITE_APP_NAME=Pinglo
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
pinglo-frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # Chat-related components
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ConversationList.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   ├── UserSidebar.jsx
│   │   │   └── UserSearchModal.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Chat.jsx
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ChatContext.jsx
│   ├── services/          # API and Socket services
│   │   ├── api.js
│   │   └── socket.js
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── package.json
├── tailwind.config.js     # Tailwind configuration
├── vite.config.js         # Vite configuration
└── README.md             # This file
```

## 🎨 Components Overview

### Authentication
- **Login**: User login form with validation
- **Register**: User registration with form validation
- **AuthContext**: Global authentication state management

### Chat Interface
- **Chat**: Main chat layout container
- **ConversationList**: List of user conversations with search
- **ChatWindow**: Active conversation display with message input
- **MessageBubble**: Individual message display with timestamps
- **TypingIndicator**: Animated typing indicator
- **UserSidebar**: User profile and navigation
- **UserSearchModal**: Search and select users for new conversations

### Context Providers
- **AuthContext**: Manages user authentication state
- **ChatContext**: Manages chat state, conversations, and messages

### Services
- **API Service**: HTTP requests to backend API
- **Socket Service**: Real-time WebSocket communication

## 🔌 Real-time Features

The app uses Socket.IO for real-time communication:

- **Message Delivery**: Instant message sending and receiving
- **Typing Indicators**: See when users are typing
- **Online Status**: Real-time user presence updates
- **Read Receipts**: Message read status tracking
- **Connection Management**: Automatic reconnection handling

## 📱 Responsive Design

Built with a mobile-first approach using Tailwind CSS:
- **Desktop**: Full sidebar layout with three panels
- **Tablet**: Collapsible sidebar with optimized spacing  
- **Mobile**: Stack-based navigation with bottom tabs

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🛠 Development

### Adding New Components
1. Create component file in appropriate directory
2. Export from component and add to routing if needed
3. Use existing contexts for state management

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Follow existing color scheme (blue primary)
- Maintain responsive design patterns
- Use consistent spacing and typography

### State Management
- Use React Context for global state
- Keep component state local when possible  
- Follow existing patterns for API calls

## 🔧 Configuration

### Tailwind CSS
Customized with:
- Custom color palette
- Extended font families
- Responsive breakpoints
- Custom scrollbar styles

### Vite Configuration
Optimized for:
- Fast development server
- Efficient production builds
- Environment variable handling
- Hot module replacement

## 🐛 Troubleshooting

**Connection Issues:**
- Verify backend is running on correct port
- Check CORS configuration
- Ensure Socket.IO URLs match

**Build Issues:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

**Styling Issues:**
- Ensure Tailwind CSS is properly configured
- Check for conflicting CSS rules
- Verify responsive breakpoints

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production
Update `.env` with production URLs:
```bash
VITE_API_URL=https://your-api-domain.com/api
VITE_SOCKET_URL=https://your-api-domain.com
```

## 📄 License

This project is part of the Pinglo messaging application.

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add proper error handling
3. Include responsive design considerations
4. Test real-time features thoroughly
5. Update documentation for new features

---

Built with ❤️ using React + Vite + Tailwind CSS
