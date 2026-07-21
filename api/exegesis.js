import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { consulta } = req.body;

    if (!consulta) {
        return res.status(400).json({ error: 'La consulta es obligatoria.' });
    }

    try {
        const promptSistema = `
            Eres el motor exegético y teológico supremo de Cielo Efata. 
            Tu propósito es responder con rigor académico, fidelidad bíblica y profundidad espiritual a cualquier consulta sobre las Escrituras.
            Estructura siempre tu respuesta en formato JSON estricto con las siguientes claves:
            - "versiones": Texto del pasaje en RVR1960 y NBLA.
            - "lexico": Análisis de palabras clave en griego o hebreo (Strong y significado).
            - "contexto": Exégesis histórico-gramatical del pasaje.
            - "aplicacion": Principio práctico de renovación mental y soberanía de Dios.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: promptSistema }, { text: `Consulta del usuario: ${consulta}` }] }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const resultado = JSON.parse(response.text);
        return res.status(200).json({ success: true, data: resultado });

    } catch (error) {
        console.error("Error en el motor exegético:", error);
        return res.status(500).json({ error: 'Error interno al procesar la exégesis.' });
    }
}