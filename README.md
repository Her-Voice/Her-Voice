# HerVoice.AI 🌹  
**AI for Women’s Safety & Emotional Wellbeing**

[![Link To Access the Site](https://her-voice-psi.vercel.app/)] 


---

## Overview

HerVoice.AI is a web application empowering women with tools for safety, emotional support, and wellbeing—powered by AI.  
Features include secure incident logging, grounding exercises, a fake call tool, and an AI assistant chat for emotional support.

---

## Features

- **Safety Vault**: Log and store safety incidents securely.
- **Fake Call**: Trigger a simulated phone call for quick help in uncomfortable situations.
- **Grounding Exercises**: Access calming methods for emotional wellbeing.
- **AI Assistant Chat**: Get supportive messages and safety tips powered by Gemini AI.
- **Interactive Map**: Find safe places or report incidents with Leaflet maps.
- **Responsive Design**: Mobile-first, but works beautifully on desktop.

---

## Tech Stack

- **React** (with TypeScript)
- **Vite** (fast builds)
- **TailwindCSS** (design)
- **Gemini AI** (Google Generative AI)
- **LeafletJS** (maps)
- **Vercel** (hosting)

---

## Getting Started

1. **Clone the repo**
    ```bash
    git clone https://github.com/Her-Voice/Her-Voice.git
    cd Her-Voice
    npm install
    ```

2. **Setup .env**
    - Copy `.env.example` to `.env`
    - Add your Gemini API key and Proxy token (for local API/chat features):
      ```env
      GEMINI_API_KEY=your-gemini-api-key-here
      VITE_PROXY_TOKEN=your-proxy-token-here
      ```
    - If you don’t have keys, UI works but chat won’t work locally.

3. **Run Locally**
    ```bash
    npm run dev
    ```
    Then open [http://localhost:3000](http://localhost:3000)

---

## Deployment

- Auto-deployed with [Vercel](https://vercel.com)
- Environment variables handled in Vercel dashboard

---

## File Structure

```
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── api/
│   ├── styles/
├── public/
│   └── favicon.svg
```

---

## Contributors

- [Sci-Norman](https://github.com/Sci-Norman)
- [sudoApT-getVickie](https://github.com/sudoApT-getVickie)

---

## License

MIT  
