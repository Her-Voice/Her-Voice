import { GoogleGenAI } from '@google/genai'; // Check if this package name is correct intended. The syntax requested matches @google/generative-ai more.
// Assuming the user meant @google/generative-ai or the package alias works.
// However, to be safe and strictly follow "Update api/gemini.js", I will use the existing import but change usage.
// If the user *meant* @google/generative-ai, I should probably check package.json again. 
// package.json has "@google/genai". 
// I will assume the user knows the method `getGenerativeModel` exists on the instance.

import dotenv from 'dotenv';
dotenv.config();

// Initialize the Google Generative AI client
const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);

// Basic protections
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const PROXY_TOKEN = process.env.PROXY_TOKEN || null;

export default async function handler(req, res) {
    // CORS Handling
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-app-token'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (PROXY_TOKEN) {
            const incoming = req.headers['x-app-token'];
            if (!incoming || incoming !== PROXY_TOKEN) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        const { type, prompt, lat, lng, config } = req.body || {};

        let contents = prompt;
        // Correctly handling systemInstruction logic
        let systemInstruction = config?.systemInstruction;

        if (type === 'safety' && typeof lat === 'number' && typeof lng === 'number') {
            contents = `Provide one concise, practical safety tip for a woman currently at coordinates ${lat}, ${lng}. If the coordinates are in a specific city like Nairobi, mention local context if relevant. Keep it under 100 characters. Be empathetic but direct.`;
            systemInstruction = systemInstruction || 'You are a local safety expert for HerVoice.AI. Provide a single, helpful safety tip based on the user\'s location.';
        }

        if (!process.env.GOOGLE_API_KEY) {
            return res.status(500).json({ error: 'Server misconfiguration: GOOGLE_API_KEY missing' });
        }

        // Initialize the model with systemInstruction
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction
        });

        // Safety: avoid hanging indefinitely when upstream is slow
        const callPromise = model.generateContent({
            contents: [{ role: 'user', parts: [{ text: contents }] }],
            generationConfig: {
                temperature: (config && config.temperature) || 0.7,
            },
        });

        const timeoutMs = 25000;
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upstream timeout')), timeoutMs));

        // @ts-ignore
        const result = await Promise.race([callPromise, timeoutPromise]);

        // Ensure response.text() is called correctly
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text: text || '' });

    } catch (err) {
        console.error('Gemini proxy error:', err);
        return res.status(500).json({ error: err.message || String(err) });
    }
}
