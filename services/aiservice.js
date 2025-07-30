import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

class AIService {
    constructor() {
        this.googleGenAI = new GoogleGenAI({
            // apiKey: process.env.GEMINI_API_KEY,
        });
    }

    async generateResponse(prompt) {
        try {
            const response = await this.googleGenAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            if (!response || !response.text) {
                throw new Error("No response text received from AI service");
            }
            return response.text;
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    }

    async generateSummary(session) {
        try {
            // Properly populate the session data with related fields
            const sessionData = await session.populate([
                { path: 'customerId', select: 'name email' },
                { path: 'agentId', select: 'name email' },
                { path: 'teamId', select: 'name' },
                { path: 'messages.senderId', select: 'name' },
                { path: 'transcripts.speaker', select: 'name' }
            ]);

            // Create a structured prompt for the AI
            const prompt = `
                Please generate a comprehensive summary of this support session:
                
                Session Details:
                - Session ID: ${sessionData.sessionId}
                - Subject: ${sessionData.subject}
                - Description: ${sessionData.description}
                - Category: ${sessionData.category}
                - Status: ${sessionData.status}
                - Priority: ${sessionData.priority}
                - Customer: ${sessionData.customerId?.name || 'Unknown'}
                - Agent: ${sessionData.agentId?.name || 'Unassigned'}
                - Team: ${sessionData.teamId?.name || 'Unknown'}
                - Created: ${sessionData.createdAt}
                - Updated: ${sessionData.updatedAt}
                
                Messages (${sessionData.messages?.length || 0} total):
                ${sessionData.messages?.map(msg =>
                `- ${msg.senderId?.name || 'Unknown'} (${msg.messageType}): ${msg.message}`
            ).join('\n') || 'No messages'}
                
                Transcripts (${sessionData.transcripts?.length || 0} total):
                ${sessionData.transcripts?.map(transcript =>
                `- ${transcript.speaker?.name || 'Unknown'}: ${transcript.transcript}`
            ).join('\n') || 'No transcripts'}
                
                Notes: ${sessionData.notes || 'No notes'}
                
                Please provide:
                1. A brief summary of the issue
                2. Key interactions and resolutions attempted
                3. Current status and next steps
                4. Any important highlights or concerns
            `;

            const summary = await this.generateResponse(prompt);

            // console.log('Generated Summary:', summary);
            return summary;

        } catch (error) {
            console.error("Error generating summary:", error);
            throw error;
        }
    }
}

export default new AIService();