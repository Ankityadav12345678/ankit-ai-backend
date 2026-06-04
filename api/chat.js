// Server par temporary memory banane ke liye ek object
let chatSessions = {};

export default async function handler(req, res) {
    // App ke liye permissions set karna
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

    // Har ek user ke liye alag memory session manage karne ke liye
    const id = userId || "default_user";
    if (!chatSessions[id]) {
        chatSessions[id] = [];
    }

    // User ka naya sawaal history mein jado aur Hindi instructions do
    chatSessions[id].push({ role: "user", parts: [{ text: text + " (Reply smartly and politely in Hindi language like a professional AI assistant)" }] });

    // Memory limit set kar rahe hain taaki pichle 12 messages hi yaad rahein aur server crash na ho
    if (chatSessions[id].length > 12) {
        chatSessions[id] = chatSessions[id].slice(-12);
    }

    try {
        // Gemini 2.5 Flash Model ke sath Real-Time Google Search and Memory connected
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: chatSessions[id],
                // Yeh line aapke app ko Google Search karne ki taakat deti hai
                tools: [{ googleSearch: {} }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            
            // AI ka jawab bhi memory mein jodo taaki use yaad rahe ki usne kya bola tha
            chatSessions[id].push({ role: "model", parts: [{ text: reply }] });
            
            return res.status(200).json({ reply: reply });
        } else {
            return res.status(200).json({ reply: "Bhai, server connect hua par Google se khali jawab aaya. Vercel par Key check karo." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: Key ya Code check karein." });
    }
}
