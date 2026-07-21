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
            Analiza la consulta, pasaje o tema bíblico del usuario y responde ESTRICTAMENTE en formato JSON con la siguiente estructura exacta:
            {
                "versiones": {
                    "rvr1960": "Texto exacto en Reina Valera 1960",
                    "nbla": "Texto exacto en Nueva Biblia de las Américas",
                    "nvi": "Texto exacto en Nueva Versión Internacional"
                },
                "idiomaOriginal": {
                    "termino": "Palabra clave en Hebreo o Griego con su transliteración",
                    "strong": "Número de Strong y morfología",
                    "analisis": "Desglose gramatical del término original"
                },
                "comentarioMacArthur": "Análisis doctrinal, histórico y exegético profundo bajo la perspectiva teológica de la Biblia de Estudio John MacArthur",
                "aplicacion": "Principio práctico enfocado en la renovación mental, la soberanía espiritual y el diseño original"
            }
            Consulta del usuario: ${consulta}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptSistema,
            config: {
                responseMimeType: "application/json"
            }
        });

        const resultado = JSON.parse(response.text);
        return res.status(200).json({ success: true, data: resultado });

    } catch (error) {
        console.error("Error en exégesis:", error);
        return res.status(500).json({ error: 'Error interno en el motor exegético.' });
    }
}