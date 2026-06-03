export default async function handler(req, res) {
    // Duniya ke kisi bhi app ko aapke server se jodne ki ijajat dena
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { text } = req.body;
    // 🔒 Aapki asli key Vercel ki tijori mein safe rahegi
    const API_KEY = process.env.GEMINI_API_KEY;

    try {
        // Updated to Gemini 2.5 Flash Model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text + " (Reply smartly, short and politely in Hindi language like a professional AI)" }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply: reply });
        } else {
            return res.status(200).json({ reply: "Bhai, server connect hua par Google se khali jawab aaya. Vercel par API Key check karo." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: Key ya Code check karein." });
    }
}
