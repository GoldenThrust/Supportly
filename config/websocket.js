import socketCookieParser from "../middlewares/socketCookieParser.js";
import socketAuthenticateToken from "../middlewares/socketTokenManager.js";
import SupportSession from "../model/SupportSession.js";
import { AssemblyAI } from 'assemblyai';

class WebSocketManager {
    constructor() {
        this.io = null;
    }

    async connect(io) {
        io.use(socketCookieParser);
        io.use(socketAuthenticateToken);

        this.io = io;

        io.on("connection", async (socket) => {
            const { sessionId } = socket.handshake.query;

            try {
                const user = {
                    ...socket.user,
                    id: socket._id,
                };

                const session = await SupportSession.findOne({
                    sessionId, $or: [
                        { customerId: user._id },
                        { agentId: user._id }
                    ]
                });

                if (!session) {
                    console.error("Session not found for user", user.email);
                    return socket.disconnect();
                }

                socket.join(sessionId);

                console.log(
                    `Connected to WebSocket ${socket.user.email}`,
                    sessionId,
                    socket.id
                );

                socket.on("rtc-signal", (signal, targetSessionId) => {
                    console.log(`WebRTC signal from ${socket.user.email} to session ${targetSessionId}`);
                    // Send signal to all other users in the session
                    socket.to(sessionId).emit("rtc-signal", signal, socket.id, user);
                });

                socket.on("return-rtc-signal", (signal, callerID) => {
                    console.log(`Return WebRTC signal from ${socket.user.email} to ${callerID}`);
                    socket.to(callerID).emit("return-rtc-signal", signal, socket.user.email);
                });

                socket.on("chat-message", (message) => {
                    console.log(`Chat message from ${socket.user.email}:`, message);
                    // Broadcast to all users in the session
                    socket.to(sessionId).emit("chat-message", {
                        ...message,
                        sender: socket.user.email,
                        timestamp: new Date().toISOString()
                    });
                });

                socket.on("end-call", () => {
                    console.log(socket.id, `${socket.user.email} ended call`);
                    socket.to(sessionId).emit("user-left", user);
                    socket.disconnect();
                });

                // Notify other users that this user joined
                socket.to(sessionId).emit("user-joined", user);

                socket.on("disconnect", async () => {
                    console.log("Disconnected from WebSocket", socket.user.email);
                });
            } catch (error) {
                console.error("WebSocket connection error:", error);
                socket.disconnect();
            }
        });
    }

    transcript() {
        const client = new AssemblyAI({
            apiKey: process.env.ASSEMBLY_AI_KEY,
        });
        const transcriber = client.streaming.transcriber({
            sampleRate: 16_000,
            formatTurns: true
        });
        transcriber.on("open", ({ id }) => {
            console.log(`Session opened with ID: ${id}`);
        });
        transcriber.on("error", (error) => {
            console.error("Error:", error);
        });
        transcriber.on("close", (code, reason) =>
            console.log("Session closed:", code, reason),
        );
        transcriber.on("turn", (turn) => {
            if (!turn.transcript) {
                return;
            }
            console.log("Turn:", turn.transcript);
        });
        try {
            await transcriber.connect();
            console.log("Starting recording");
            Readable.toWeb(recording.stream()).pipeTo(transcriber.stream());
            // Stop recording and close connection using Ctrl-C.
            await transcriber.close();
        } catch (error) {
            console.error(error);
        }
    }
}

const websocket = new WebSocketManager();
export default websocket;
