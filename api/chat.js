// Server par temporary memory backup ke liye
let chatSessions = {};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { text, userId } = req.body; 
    const API_KEY = process.env.GEMINI_API_KEY;

    // Har user ke liye alag chat storage banana
    const id = userId || "default_user";
    if (!chatSessions[id]) {
        chatSessions[id] = [];
    }

    // User ka message history mein add karna
    chatSessions[id].push({ role: "user", parts: [{ text: text + " (Reply smartly, short and politely in Hindi language like a professional AI assistant)" }] });

    // History ko safe limit (10 messages) par rakhna taaki free plan crash na ho
    if (chatSessions[id].length > 10) {
        chatSessions[id] = chatSessions[id].slice(-10);
    }

    try {
        // Pure Gemini 2.5 Flash Model - Without Google Search Tools (Safe for Free Key)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: chatSessions[id]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            
            // AI ka reply bhi history mein save karna
            chatSessions[id].push({ role: "model", parts: [{ text: reply }] });
            
            return res.status(200).json({ reply: reply });
        } else {
            return res.status(200).json({ reply: "Bhai, server connect hua par Google se khali jawab aaya. Vercel par Key check karo." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: Key ya Code check karein." });
    }
}
