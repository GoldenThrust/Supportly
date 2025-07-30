import socketCookieParser from "../middlewares/socketCookieParser.js";
import socketAuthenticateToken from "../middlewares/socketTokenManager.js";
import SupportSession from "../model/SupportSession.js";
import User from "../model/User.js";
import AssemblyAIConfigClass from "../services/assembyai.js";
import aiservice from "./aiservice.js";
import mailservice from "./mailservice.js";
import { formatDateForEmail } from "../utils/functions.js";
class WebSocketManager {
    constructor() {
        this.io = null;
        this.userTranscribers = new Map();
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

                // Create a new AssemblyAI instance for this user
                const assemblyai = new AssemblyAIConfigClass();
                this.userTranscribers.set(socket.id, assemblyai);

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

                    const messageConfig = {
                        ...message,
                        sender: socket.user.name,
                        timestamp: new Date().toISOString()
                    };

                    socket.session.addMessage(messageConfig.sender, messageConfig.text);
                    socket.to(sessionId).emit("chat-message", messageConfig);
                });

                socket.on("end-call", async () => {
                    console.log(socket.id, `${socket.user.email} ended call`);

                    if (["support_agent", 'admin'].includes(socket.user.role)) {
                        try {
                            // Generate AI summary
                            const summary = await aiservice.generateSummary(socket.session);

                            // End the session with summary
                            await socket.session.end(socket.user._id, summary, "closed");

                            // Reload session with populated data
                            const populatedSession = await SupportSession.findById(socket.session._id)
                                .populate([{ path: 'customerId', select: 'name email' },
                                { path: 'agentId', select: 'name email' }]);

                            if (populatedSession) {
                                // Format category for display
                                const formatCategory = (category) => {
                                    const categoryMap = {
                                        'technical': 'Technical Support',
                                        'billing': 'Billing & Payments',
                                        'general': 'General Inquiry',
                                        'complaint': 'Complaint',
                                        'feature_request': 'Feature Request'
                                    };
                                    return categoryMap[category] || category;
                                };

                                const formattedCategory = formatCategory(populatedSession.category);

                                // Send summary email to customer
                                if (populatedSession.customerId) {
                                    try {
                                        await mailservice.sendCustomerSessionSummary(
                                            populatedSession.sessionId,
                                            populatedSession.subject,
                                            populatedSession.description,
                                            formattedCategory,
                                            summary,
                                            populatedSession.agentId?.name || 'Support Agent',
                                            populatedSession.customerId,
                                            populatedSession
                                        );
                                        console.log(`✅ Customer summary sent to: ${populatedSession.customerId.email}`);
                                    } catch (emailError) {
                                        console.error('❌ Error sending customer summary email:', emailError);
                                    }
                                }

                                // Send summary email to agent
                                if (populatedSession.agentId) {
                                    try {
                                        await mailservice.sendAgentSessionSummary(
                                            populatedSession.sessionId,
                                            populatedSession.subject,
                                            populatedSession.description,
                                            formattedCategory,
                                            summary,
                                            populatedSession.agentId.name,
                                            populatedSession.customerId,
                                            populatedSession
                                        );
                                        console.log(`✅ Agent summary sent to: ${populatedSession.agentId.email}`);
                                    } catch (emailError) {
                                        console.error('❌ Error sending agent summary email:', emailError);
                                    }
                                }

                                console.log(`📋 Session #${populatedSession.sessionId} completed successfully`);
                            } else {
                                console.error('❌ Could not find session after ending call');
                            }
                        } catch (error) {
                            console.error('❌ Error processing session end:', error);
                        }
                    }

                    socket.to(sessionId).emit("user-left", user);
                    socket.disconnect();
                });

                socket.on("start-transcription", async () => {
                    console.log(`Starting transcription for ${socket.user.email}`);
                    const assemblyai = this.userTranscribers.get(socket.id);
                    if (assemblyai) {
                        // Check if already running or connecting to prevent duplicate starts
                        if (assemblyai.isConnected || assemblyai.isConnecting) {
                            console.log('Transcription already running or starting...');
                            return;
                        }

                        try {
                            await assemblyai.run();
                            assemblyai.transcribe((transcript) => {
                                console.log(`Transcription for ${socket.user.email}:`, transcript);

                                socket.session.addTranscript(socket.user, transcript);
                                // Emit transcription to all users in the session
                                socket.to(sessionId).emit("transcription", transcript);
                            });
                            console.log('Transcription started successfully');
                        } catch (error) {
                            console.error('Error starting transcription:', error);
                        }
                    }
                });

                socket.on('audio-chunk', async (audioBlob) => {
                    const assemblyai = this.userTranscribers.get(socket.id);
                    if (assemblyai) {
                        assemblyai.sendAudio(audioBlob);
                    }
                });


                // Notify other users that this user joined
                socket.to(sessionId).emit("user-joined", user);

                socket.on("disconnect", async () => {
                    console.log("Disconnected from WebSocket", socket.user.email);
                    // Clean up transcription when user disconnects
                    const assemblyai = this.userTranscribers.get(socket.id);
                    if (assemblyai) {
                        await assemblyai.safeClose();
                        this.userTranscribers.delete(socket.id);
                    }
                });
            } catch (error) {
                console.error("WebSocket connection error:", error);
                socket.disconnect();
            }
        });
    }
}

const websocket = new WebSocketManager();
export default websocket;
