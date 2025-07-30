import { AssemblyAI } from 'assemblyai'
import logger from '../services/logger.js';
const DISABLE_ASSEMBLYAI = true;


const mockTranscription = [
    "Hello, how can I help you today?",
    "I am looking for support with my account.",
    "Sure, I can assist you with that.",
    "Can you please provide your account details?",
    "My account number is 123456.",
    "Thank you for providing your account number.",
    "Is there anything else I can help you with?",
    "Yes, I need help resetting my password.",
    "Sure, I can help you with that.",
    "Please follow the instructions I will send you.",
    "I have sent the instructions to your email.",
    "Thank you for your assistance.",
    "You're welcome! Is there anything else?",
    "No, that will be all. Thank you!",
    "Alright, have a great day!",
    "Goodbye!",
];

class AssemblyAIConfig {
    constructor() {
        try {
            if (DISABLE_ASSEMBLYAI) {
                logger.info('AssemblyAI is disabled');
                return;
            }

            logger.info('Initializing AssemblyAIConfig...');

            this.client = new AssemblyAI({
                apiKey: process.env.ASSEMBLYAI_API_KEY,
            });
            this.transcriber = null;
            this.isConnected = false;
            this.isConnecting = false;
            // this.audioBuffer = [];

        } catch (error) {
            logger.error(error);
        }
    }

    async run() {
        try {
            // Prevent multiple concurrent connection attempts
            if (this.isConnecting || this.isConnected) {
                logger.info('Connection already in progress or established...');
                return;
            }

            if (DISABLE_ASSEMBLYAI) {
                logger.info('AssemblyAI is disabled, skipping connection');
                return;
            }

            this.isConnecting = true;

            // // Close existing transcriber if any
            // if (this.transcriber) {
            //     await this.safeClose();
            // }

            this.transcriber = this.client.streaming.transcriber({
                sampleRate: 16_000,
                formatTurns: true
            });



            // Set up event handlers before connecting
            this.transcriber.on("open", ({ id }) => {
                logger.info(`Session opened with ID: ${id}`);
                this.isConnected = true;
                this.isConnecting = false;
                // Process any buffered audio chunks
                // setTimeout(() => this.processBufferedAudio(), 100);
            });

            this.transcriber.on("error", (error) => {
                logger.error("Transcriber error:", error);
                this.isConnected = false;
                this.isConnecting = false;
            });

            this.transcriber.on("close", (code, reason) => {
                logger.info("Session closed:", code, reason);
                this.isConnected = false;
                this.isConnecting = false;
            });

            logger.info("Connecting to streaming transcript service");

            await this.transcriber.connect();
            logger.info("Starting streaming...");
        } catch (error) {
            logger.error('Error in run():', error);
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    async sendAudio(audioBuffer) {
        if (DISABLE_ASSEMBLYAI) {
            // logger.info('AssemblyAI is disabled, skipping audio send');
            return;
        }

        if (!this.transcriber || this.transcriber.readyState !== 1) {
            // logger.error('Transcriber is not connected or ready to send audio');
            return;
        }

        try {
            let buffer = audioBuffer;
            if (audioBuffer instanceof Blob) {
                buffer = await audioBuffer.arrayBuffer();
            }
            this.transcriber.sendAudio(Buffer.from(buffer));
        } catch (error) {
            logger.error('Error processing audio chunk:', error);
        }
    }

    transcribe(callBack) {
        if (DISABLE_ASSEMBLYAI) {
            // Simulate transcription for testing purposes
            let index = 0;
            const interval = setInterval(() => {
                if (index < mockTranscription.length) {
                    callBack(mockTranscription[index]);
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, 3000);
            return;
        }

        logger.info('Starting transcription...');

        this.transcriber.on("turn", (turn) => {
            if (!turn.transcript) {
                return;
            }

            callBack(turn.transcript);
        });

    }

    async safeClose() {
        try {
            if (this.transcriber) {
                // Don't try to close if it's still connecting
                if (this.transcriber.readyState === 0) { // CONNECTING
                    logger.info('Transcriber still connecting, setting to null without closing');
                    this.transcriber = null;
                    return;
                }

                if (this.transcriber.readyState === 1) { // OPEN
                    await this.transcriber.close();
                }
                this.transcriber = null;
            }
        } catch (error) {
            logger.error('Error in safeClose:', error);
            this.transcriber = null;
        }
    }

    async close() {
        try {
            this.isConnected = false;
            this.isConnecting = false;
            // this.audioBuffer = [];

            if (this.transcriber) {
                // Check if the transcriber connection is in a valid state before closing
                if (this.transcriber.readyState === 1) { // WebSocket OPEN state
                    await this.transcriber.close();
                } else if (this.transcriber.readyState === 0) { // WebSocket CONNECTING state
                    // Wait a moment for connection to establish or fail, then close
                    setTimeout(() => {
                        if (this.transcriber && this.transcriber.readyState === 1) {
                            this.transcriber.close();
                        }
                    }, 3000);
                }
                this.transcriber = null;
            }
        } catch (error) {
            logger.error('Error closing transcriber:', error);
            // Ensure cleanup even if close fails
            this.transcriber = null;
            this.isConnected = false;
            this.isConnecting = false;
            // this.audioBuffer = [];
        }
    }
}

export default AssemblyAIConfig;