# WebSocket Integration for Video Calls

## Overview
The video call functionality has been enhanced with WebSocket integration for real-time communication using Socket.IO and WebRTC.

## Features Implemented

### 1. WebSocket Connection
- Connects to the Socket.IO server with session-based rooms
- Handles authentication via cookies
- Real-time connection status indicator

### 2. WebRTC Integration
- Peer-to-peer video calling using simple-peer library
- Screen sharing capability
- Audio/video controls (mute/unmute, camera on/off)

### 3. Real-time Chat
- Live chat messages during video calls
- System notifications for user actions
- Message history

### 4. Session Management
- Users join specific session rooms
- Support for multiple participants
- Proper cleanup on disconnect

## Technical Implementation

### Client Side (React Component)
- `socket.io-client` for WebSocket connection
- `simple-peer` for WebRTC functionality
- Real-time state management with React hooks

### Server Side (Node.js/Express)
- Socket.IO server with Redis adapter
- Authentication middleware for WebSocket connections
- Session-based room management

## WebSocket Events

### Client → Server
- `rtc-signal`: WebRTC signaling data
- `return-rtc-signal`: WebRTC response signaling
- `chat-message`: Chat message data
- `end-call`: Call termination

### Server → Client
- `rtc-signal`: WebRTC signaling from other users
- `return-rtc-signal`: WebRTC response from other users
- `chat-message`: Broadcast chat messages
- `user-joined`: User joined notification
- `user-left`: User left notification

## Usage

1. Users navigate to `/video-call/:sessionId`
2. WebSocket connection is established automatically
3. Local media stream is initialized
4. Users can initiate calls to other participants in the same session
5. Real-time chat is available throughout the session

## Files Modified

### Frontend
- `app/routes/video-call.$sessionId.tsx`: Main video call component with WebSocket integration

### Backend
- `config/websocket.js`: WebSocket event handlers
- `middlewares/socketTokenManager.js`: Authentication middleware for WebSocket connections
- `middlewares/socketCookieParser.js`: Cookie parsing for WebSocket

## Dependencies Added
- `@types/simple-peer`: TypeScript types for simple-peer library

## Environment Requirements
- WebSocket server running on port 3000 (or configured port)
- Redis server for Socket.IO adapter
- HTTPS for production (required for camera/microphone access)

## Security Features
- Token-based authentication for WebSocket connections
- Session validation before joining rooms
- Proper cleanup of resources on disconnect
