const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 8080;

// Basic protections
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const PROXY_TOKEN = process.env.PROXY_TOKEN || null;

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(bodyParser.json());

if (!process.env.GOOGLE_API_KEY) {
  console.warn('WARNING: GOOGLE_API_KEY is not set. Create a .env with GOOGLE_API_KEY=your_key');
}

// Rate limiter: 60 requests per minute per IP
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/gemini', async (req, res) => {
  try {
    // Require a simple proxy token from the frontend to avoid public misuse
    if (PROXY_TOKEN) {
      const incoming = req.headers['x-app-token'];
      if (!incoming || incoming !== PROXY_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    const { type, prompt, lat, lng, config } = req.body || {};

    let contents = prompt;
    let systemInstruction = config?.systemInstruction;

    if (type === 'safety' && typeof lat === 'number' && typeof lng === 'number') {
      contents = `Provide one concise, practical safety tip for a woman currently at coordinates ${lat}, ${lng}. If the coordinates are in a specific city like Nairobi, mention local context if relevant. Keep it under 100 characters. Be empathetic but direct.`;
      systemInstruction = systemInstruction || 'You are a local safety expert for HerVoice.AI. Provide a single, helpful safety tip based on the user\'s location.';
    }

    if (type === 'tts') {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp', // Using 2.0-flash-exp as a stable fallback for 2.5 preview if needed, or stick to user's 2.5 if confident.
        // formatting as any to avoid TS issues in JS file if checked
      });

      // TTS specific request
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: contents }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: (config && config.voiceName) || 'Puck'
              },
            },
          },
        },
      });

      const response = await result.response;
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      return res.json({ audioData });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction,
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
    const result = await Promise.race([callPromise, timeoutPromise]);

    const response = await result.response;
    const text = response.text();

    return res.json({ text: text || '' });

    return res.json({ text: response.text || '' });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(port, () => {
  console.log(`Gemini proxy server listening on http://localhost:${port}`);
});
