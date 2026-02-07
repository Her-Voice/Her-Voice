
// Frontend proxy service: call server-side proxy at /api/gemini
// Base config for HerVoice AI personality
const HERVOICE_SYSTEM_PROMPT = `You are HerVoice.AI, a compassionate digital companion for urban women's safety and wellbeing, specifically designed for contexts like Nairobi, Kenya.
Your mission is to provide:
1. Real-time emotional grounding (breathing, affirmations) if a user sounds distressed.
2. Safe, non-judgmental conversational support.
3. Logical safety advice (e.g., "Find a well-lit area").
Always use a warm, empathetic tone. Avoid clinical jargon. Validate their feelings.
In grounding mode: speak slowly, guide breathing (4-7-8 method), and offer localized affirmations.`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callProxy(payload: any, isRetry = false) {
  try {
    const token = (import.meta as any).env?.VITE_PROXY_TOKEN || '';
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-app-token': token },
      body: JSON.stringify(payload),
    });

    if (res.status === 429 && !isRetry) {
      console.warn("Received 429 Too Many Requests. Retrying in 25 seconds...");
      await wait(25000);
      return callProxy(payload, true);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Proxy returned ${res.status}`);
    }
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    console.error('Failed to call Gemini proxy:', err);
    throw err;
  }
}

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const text = await callProxy({ type: 'chat', prompt, config: { systemInstruction: HERVOICE_SYSTEM_PROMPT, temperature: 0.7 } });
    return text || "I'm sorry, I couldn't process that. I'm here for you.";
  } catch (err) {
    return "I'm sorry, I couldn't process that. I'm here for you.";
  }
};

export const getLocationSafetyTip = async (lat: number, lng: number): Promise<string> => {
  try {
    const text = await callProxy({ type: 'safety', lat, lng, config: { temperature: 0.8 } });
    return text?.trim() || "Stay aware of your surroundings and trust your intuition.";
  } catch (error) {
    console.error("Failed to get safety tip:", error);
    return "Stay in well-lit areas and keep your phone charged while traveling.";
  }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
  try {
    const response = await callProxy({
      type: 'tts',
      prompt: text,
      config: { voiceName }
    });
    return response.audioData || '';
  } catch (err) {
    console.error('Failed to generate speech:', err);
    return '';
  }
};

export const generateIncidentReport = async (rawTranscript: string, locationData: any): Promise<any> => {
  try {
    const prompt = `Summarize the following transcript into an incident report:\n\n${rawTranscript}`;
    const text = await callProxy({ type: 'report', prompt, config: { systemInstruction: HERVOICE_SYSTEM_PROMPT } });
    return { summary: text };
  } catch (err) {
    console.error('Failed to generate incident report:', err);
    return { summary: '' };
  }

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
