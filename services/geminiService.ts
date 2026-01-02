
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

// Base config for HerVoice AI personality
const HERVOICE_SYSTEM_PROMPT = `You are HerVoice.AI, a compassionate digital companion for urban women's safety and wellbeing, specifically designed for contexts like Nairobi, Kenya.
Your mission is to provide:
1. Real-time emotional grounding (breathing, affirmations) if a user sounds distressed.
2. Safe, non-judgmental conversational support.
3. Logical safety advice (e.g., "Find a well-lit area").
Always use a warm, empathetic tone. Avoid clinical jargon. Validate their feelings.
In grounding mode: speak slowly, guide breathing (4-7-8 method), and offer localized affirmations.`;

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: HERVOICE_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });
  return response.text || "I'm sorry, I couldn't process that. I'm here for you.";
};

export const generateIncidentReport = async (rawTranscript: string, locationData: any): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this raw transcript into a structured safety report. 
    Transcript: "${rawTranscript}"
    Location: ${JSON.stringify(locationData)}
    Extract: Time, Location, Incident Description, Context, Perpetrator Info.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          context: { type: Type.STRING },
          perpetratorInfo: { type: Type.STRING },
          timestamp: { type: Type.STRING },
        },
        required: ["description", "context", "perpetratorInfo"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

// --- Audio Utilities for Live API ---
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
