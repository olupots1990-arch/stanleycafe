
import { GoogleGenAI, Chat, GenerateContentResponse, Modality } from "@google/genai";
import { ChatMessage, MenuItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const getAIClient = () => new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;

export const startChat = (systemInstruction: string, menu: MenuItem[], history: ChatMessage[]) => {
    const ai = getAIClient();
    const menuString = menu.map(item => `- ${item.name}: $${item.price.toFixed(2)}`).join('\n');
    const fullSystemInstruction = `${systemInstruction}\n\nHere is the current menu:\n${menuString}`;
    
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: fullSystemInstruction,
        },
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }))
    });
};

export const sendMessageToChat = async (message: string): Promise<string> => {
    if (!chat) {
        throw new Error("Chat not initialized. Call startChat first.");
    }
    try {
        const result: GenerateContentResponse = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        return "Sorry, I'm having trouble connecting right now. Please try again later.";
    }
};

export const generateVoice = async (text: string): Promise<string | null> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say with a clear and pleasant tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating voice:", error);
        return null;
    }
};
