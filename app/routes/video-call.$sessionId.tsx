import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { io, Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "~/store/hooks";
import { selectCurrentSession, selectUser } from "~/store/selectors";
import { joinSession } from "~/store/slices/supportSessionSlice";
import Peer from "simple-peer";

export function meta() {
  return [
    { title: "Video Call - Supportly" },
    { name: "description", content: "Support video call session" },
  ];
}

const iceServersConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.stunprotocol.org" },
    { urls: "stun:stun.voipstunt.com" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:turn.bistri.com:80",
      username: "homeo",
      credential: "homeo",
    },
    {
      urls: "turn:turn.anyfirewall.com:443?transport=tcp",
      username: "webrtc",
      credential: "webrtc",
    },
  ],
};

export default function VideoCall() {
  const { sessionId } = useParams();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "System",
      message: "Support session started",
      timestamp: new Date(),
      type: "system",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUser, setRemoteUser] = useState<any>(null);
  const [showScreenShareNotification, setShowScreenShareNotification] =
    useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dispatch = useAppDispatch();
  const sessionData = useAppSelector(selectCurrentSession);
  const [users, setUsers] = useState<{
    me: User | null | undefined;
    remoteUser: User | null | undefined;
  } | null>(null);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    dispatch(joinSession(sessionId));
  }, [dispatch, sessionId]);

  useEffect(() => {
    if (user?.email === sessionData?.customerId?.email) {
      setUsers({
        me: sessionData?.customerId,
        remoteUser: sessionData?.agentId,
      });
    } else {
      setUsers({
        me: sessionData?.agentId,
        remoteUser: sessionData?.customerId,
      });
    }
  }, [user, sessionData]);

  useEffect(() => {
    startCall();
    initializeWebSocket();

    // Add keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "S") {
        event.preventDefault();
        if (isCallActive) {
          toggleScreenShare();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      cleanup();
    };
  }, []);

  const initializeWebSocket = () => {
    // Connect to WebSocket server
    const socket = io("http://localhost:3000", {
      withCredentials: true,
      query: { sessionId },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
      setIsCallActive(false);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message: "Connection error. Please check your authentication.",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    });

    // WebRTC signaling events
    socket.on("rtc-signal", (signal: any, callerID: string, user: any) => {
      console.log("Received WebRTC signal from:", user.email);
      setRemoteUser(user);

      if (!peerRef.current) {
        createPeer(false, signal, callerID);
      } else {
        peerRef.current.signal(signal);
      }
    });

    socket.on("return-rtc-signal", (signal: any, userEmail: string) => {
      console.log("Received return WebRTC signal from:", userEmail);
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    });

    // Chat events
    socket.on("chat-message", (message: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: message.sender,
          message: message.text,
          timestamp: new Date(message.timestamp),
          type: message.type || "user",
        },
      ]);
    });

    socket.on("user-joined", (user: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message: `${user.email} joined the session`,
          timestamp: new Date(),
          type: "system",
        },
      ]);
    });

    socket.on("user-left", (user: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message: `${user.email} left the session`,
          timestamp: new Date(),
          type: "system",
        },
      ]);
    });
  };

  const createPeer = (initiator: boolean, signal?: any, callerID?: string) => {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current || undefined,
      config: iceServersConfig,
    });

    peer.on("signal", (data: any) => {
      if (initiator) {
        // Find other users in the room and call them
        socketRef.current?.emit("rtc-signal", data, sessionId);
      } else {
        socketRef.current?.emit("return-rtc-signal", data, callerID);
      }
    });

    peer.on("stream", (remoteStream: MediaStream) => {
      console.log("Received remote stream");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setIsCallActive(true);

      // Add success message
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message: "Video call connected successfully!",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    });

    peer.on("error", (error: Error) => {
      console.error("Peer connection error:", error);
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
      setIsCallActive(false);
    });

    peer.on("connect", () => {
      console.log("Peer connected");
    });

    if (signal) {
      peer.signal(signal);
    }

    peerRef.current = peer;
    return peer;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (peerRef.current) {
      peerRef.current.destroy();
    }

    if (socketRef.current) {
      socketRef.current.emit("end-call");
      socketRef.current.disconnect();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Apply current audio/video settings
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
      initiateCall();

      console.log("Local media stream started");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      // Show error message to user
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message:
            "Failed to access camera/microphone. Please check permissions.",
          timestamp: new Date(),
          type: "system",
        },
      ]);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);

    // Stop local video streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit("end-call");
    }

    // Add system message
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "System",
        message: "Call ended",
        timestamp: new Date(),
        type: "system",
      },
    ]);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMutedState;
      });
    }

    // Add chat message
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "System",
        message: newMutedState ? "Microphone muted" : "Microphone unmuted",
        timestamp: new Date(),
        type: "system",
      },
    ]);
  };

  const toggleVideo = () => {
    const newVideoOffState = !isVideoOff;
    setIsVideoOff(newVideoOffState);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOffState;
      });
    }

    // Add chat message
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "System",
        message: newVideoOffState ? "Camera turned off" : "Camera turned on",
        timestamp: new Date(),
        type: "system",
      },
    ]);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Replace video track in peer connection
        if (peerRef.current && localStreamRef.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerRef.current.streams[0]?.getVideoTracks()[0];

          if (sender) {
            await peerRef.current.replaceTrack(sender, videoTrack);
          }
        }

        // Stop current camera stream
        if (localStreamRef.current) {
          localStreamRef.current
            .getVideoTracks()
            .forEach((track) => track.stop());
        }

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(true);

        // Handle screen share ending
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setIsScreenSharing(false);
          // Switch back to camera
          switchBackToCamera();
        });

        // Add chat message
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "System",
            message: "Screen sharing started",
            timestamp: new Date(),
            type: "system",
          },
        ]);

        // Show notification
        setShowScreenShareNotification(true);
        setTimeout(() => setShowScreenShareNotification(false), 3000);
      } catch (error) {
        console.error("Error sharing screen:", error);
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "System",
            message: "Failed to start screen sharing",
            timestamp: new Date(),
            type: "system",
          },
        ]);
      }
    } else {
      switchBackToCamera();
    }
  };

  const switchBackToCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Replace video track in peer connection
      if (peerRef.current && localStreamRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = localStreamRef.current.getVideoTracks()[0];

        if (sender) {
          await peerRef.current.replaceTrack(sender, videoTrack);
        }
      }

      // Stop screen share stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsScreenSharing(false);

      // Apply current settings
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });

      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });

      // Add chat message
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "System",
          message: "Screen sharing stopped",
          timestamp: new Date(),
          type: "system",
        },
      ]);

      // Show notification
      setShowScreenShareNotification(true);
      setTimeout(() => setShowScreenShareNotification(false), 3000);
    } catch (error) {
      console.error("Error switching back to camera:", error);
    }
  };

  const initiateCall = () => {
    if (!localStreamRef.current) {
      console.error("No local stream available");
      return;
    }

    // Create peer as initiator
    createPeer(true);

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "System",
        message: "Calling...",
        timestamp: new Date(),
        type: "system",
      },
    ]);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      const message = {
        sender: "Support Agent",
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: "agent",
      };

      // Send to other participants via WebSocket
      socketRef.current.emit("chat-message", message);

      // Add to local chat
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: message.sender,
          message: message.text,
          timestamp: new Date(message.timestamp),
          type: message.type,
        },
      ]);

      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-400 hover:text-white">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-white font-semibold">
                Support Session with {users?.remoteUser?.name || "loading..."}
              </h1>
              <p className="text-gray-400 text-sm">
                {sessionData?.subject || "loading..."}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isCallActive && (
              <div className="text-white bg-red-600 px-3 py-1 rounded-full text-sm">
                {formatDuration(callDuration)}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-gray-400 text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              Session ID: {sessionData?.sessionId || "loading..."}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Screen Share Notification */}
        {showScreenShareNotification && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">
              {isScreenSharing
                ? "Screen sharing started!"
                : "Screen sharing stopped!"}
            </span>
          </div>
        )}

        {/* Video Area */}
        <div className="flex-1 relative group">
          {/* Remote Video (Customer) */}
          <div className="w-full h-full bg-gray-800 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isCallActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-semibold">
                      {remoteUser
                        ? remoteUser.name.charAt(0).toUpperCase()
                        : users?.remoteUser?.name.charAt(0) ?? "loading..."}
                    </span>
                  </div>
                  <p className="text-white text-lg mb-2">
                    {remoteUser ? remoteUser.name : users?.remoteUser?.name}
                  </p>
                  <p className="text-gray-400">
                    {isConnected ? "Waiting to join..." : "Connecting..."}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {remoteUser ? remoteUser.name : users?.remoteUser?.name}
            </div>
            {isScreenSharing && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 animate-pulse">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="9" r="2" />
                </svg>
                <span>Screen Sharing</span>
              </div>
            )}

            {/* Floating Screen Share Button (appears on hover) */}
            {isCallActive && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button
                  onClick={toggleScreenShare}
                  className={`px-6 py-3 rounded-full text-white font-medium transition-all duration-200 flex items-center space-x-3 text-lg shadow-2xl ${
                    isScreenSharing
                      ? "bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-300 ring-opacity-50"
                      : "bg-gray-900 hover:bg-gray-800 bg-opacity-90 hover:bg-opacity-95 border-2 border-gray-500"
                  }`}
                  title={
                    isScreenSharing
                      ? "Stop screen sharing"
                      : "Share your screen"
                  }
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                    {isScreenSharing && (
                      <circle cx="12" cy="9" r="2" fill="currentColor" />
                    )}
                  </svg>
                  <span>
                    {isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Local Video (Agent) */}
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {users?.me?.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              You ({users?.me?.name})
            </div>
            {isScreenSharing && (
              <div className="absolute bottom-2 left-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold text-center flex items-center justify-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="9" r="2" />
                </svg>
                <span>Sharing Screen</span>
              </div>
            )}
            {isScreenSharing && (
              <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 animate-pulse">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="9" r="2" />
                </svg>
                <span>Screen Sharing</span>
              </div>
            )}
          </div>

          {/* Screen Share Quick Access Button */}
          {isCallActive && (
            <div className="absolute top-4 right-4">
              <button
                onClick={toggleScreenShare}
                className={`px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300 ring-opacity-50"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-600"
                }`}
                title={
                  isScreenSharing ? "Stop screen sharing" : "Share your screen"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                  {isScreenSharing && (
                    <circle cx="12" cy="9" r="2" fill="currentColor" />
                  )}
                </svg>
                <span>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</span>
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800 rounded-full px-6 py-3">
              {!isCallActive ? (
                <button
                  onClick={initiateCall}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full"
                  disabled={!isConnected}
                  title={
                    !isConnected ? "Please wait for connection" : "Start call"
                  }
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full ${
                      isMuted
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    } text-white transition-colors`}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${
                      isVideoOff
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    } text-white transition-colors`}
                    title={isVideoOff ? "Turn camera on" : "Turn camera off"}
                  >
                    {isVideoOff ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full ${
                      isScreenSharing
                        ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300"
                        : "bg-gray-600 hover:bg-gray-700"
                    } text-white transition-all duration-200`}
                    title={
                      isScreenSharing
                        ? "Stop screen sharing (Ctrl+Shift+S)"
                        : "Start screen sharing (Ctrl+Shift+S)"
                    }
                  >
                    {isScreenSharing ? (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                        <circle cx="12" cy="9" r="2" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={endCall}
                    className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                    title="End call"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Session Chat</h3>
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p className="font-medium">Keyboard Shortcuts:</p>
              <p>Ctrl+Shift+S: Toggle screen sharing</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`${message.type === "system" ? "text-center" : ""}`}
              >
                {message.type === "system" ? (
                  <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                    {message.message}
                  </div>
                ) : (
                  <div
                    className={`${
                      message.sender === "Support Agent"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                        message.sender === "Support Agent"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.sender} •{" "}
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-1 py-2 rounded-md"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
