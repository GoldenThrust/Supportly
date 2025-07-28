import { Readable } from 'stream'
import { AssemblyAI } from 'assemblyai'

class AssemblyAIConfig {
    constructor() {
        try {
            this.client = new AssemblyAI({
                apiKey: process.env.ASSEMBLYAI_API_KEY,
            });
            this.transcriber = null;
            this.isConnected = false;
            this.isConnecting = false;
            // this.audioBuffer = [];

        } catch (error) {
            console.error(error);
        }
    }

    async run() {
        try {
            // Prevent multiple concurrent connection attempts
            if (this.isConnecting || this.isConnected) {
                console.log('Connection already in progress or established...');
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
                console.log(`Session opened with ID: ${id}`);
                this.isConnected = true;
                this.isConnecting = false;
                // Process any buffered audio chunks
                // setTimeout(() => this.processBufferedAudio(), 100);
            });

            this.transcriber.on("error", (error) => {
                console.error("Transcriber error:", error);
                this.isConnected = false;
                this.isConnecting = false;
            });

            this.transcriber.on("close", (code, reason) => {
                console.log("Session closed:", code, reason);
                this.isConnected = false;
                this.isConnecting = false;
            });

            console.log("Connecting to streaming transcript service");

            await this.transcriber.connect();
            console.log("Starting streaming...");
        } catch (error) {
            console.error('Error in run():', error);
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    transcribe(callBack) {
        this.transcriber.on("turn", (turn) => {
            if (!turn.transcript) {
                return;
            }

            callBack(turn.transcript);
        });
    }

    // async stream(audioData) {
    //     try {
    //         // Check if transcriber is connected before streaming
    //         if (!this.transcriber || !this.isConnected) {
    //             // Buffer audio chunks until connection is ready
    //             console.log('Buffering audio chunk - transcriber not ready', this.isConnected, this.isConnecting);
    //             // console.log(this.transcriber);
    //             this.audioBuffer.push(audioData);
    //             return;
    //         }

    //         await this.streamAudioData(audioData);
    //     } catch (error) {
    //         console.error('Error streaming audio data:', error);
    //     }
    // }

    // async streamAudioData(audioData) {
    //     try {
    //         // Double-check connection status before streaming
    //         if (!this.transcriber || !this.isConnected) {
    //             console.log('Transcriber not ready for streaming');
    //             return;
    //         }

    //         // Additional check for WebSocket ready state
    //         if (this.transcriber.readyState !== 1) {
    //             console.log('WebSocket not in OPEN state:', this.transcriber.readyState);
    //             this.isConnected = false;
    //             return;
    //         }

    //         // Convert Buffer to Readable stream if needed
    //         let readableStream;
    //         if (Buffer.isBuffer(audioData)) {
    //             readableStream = Readable.from([audioData]);
    //         } else if (audioData instanceof Readable) {
    //             readableStream = audioData;
    //         } else {
    //             throw new Error('Invalid audio data type. Expected Buffer or Readable stream.');
    //         }
            
    //         const webStream = Readable.toWeb(readableStream);
    //         await webStream.pipeTo(this.transcriber.stream());
    //     } catch (error) {
    //         console.error('Error in streamAudioData:', error);
    //         // Reset connection state on streaming errors
    //         this.isConnected = false;
    //     }
    // }

    // async processBufferedAudio() {
    //     if (this.audioBuffer.length > 0) {
    //         console.log(`Processing ${this.audioBuffer.length} buffered audio chunks`);
    //         for (const audioData of this.audioBuffer) {
    //             try {
    //                 await this.streamAudioData(audioData);
    //             } catch (error) {
    //                 console.error('Error processing buffered audio:', error);
    //             }
    //         }
    //         this.audioBuffer = [];
    //     }
    // }

    async safeClose() {
        try {
            if (this.transcriber) {
                // Don't try to close if it's still connecting
                if (this.transcriber.readyState === 0) { // CONNECTING
                    console.log('Transcriber still connecting, setting to null without closing');
                    this.transcriber = null;
                    return;
                }
                
                if (this.transcriber.readyState === 1) { // OPEN
                    await this.transcriber.close();
                }
                this.transcriber = null;
            }
        } catch (error) {
            console.error('Error in safeClose:', error);
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
            console.error('Error closing transcriber:', error);
            // Ensure cleanup even if close fails
            this.transcriber = null;
            this.isConnected = false;
            this.isConnecting = false;
            // this.audioBuffer = [];
        }
    }
}

export default AssemblyAIConfig;