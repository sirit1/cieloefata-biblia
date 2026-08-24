import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

console.log(
  '1. Verificando API Key:',
  apiKey ? `Detectada (...${apiKey.slice(-5)})` : '❌ NO ENCONTRADA EN .env'
);

if (!apiKey) {
  console.error('Detén aquí: Coloca GEMINI_API_KEY=tu_clave en el archivo .env');
  process.exit(1);
}

async function testAI() {
  console.log('2. Enviando consulta teológica a Gemini...');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Dame un análisis exegético y de transformación mental en 3 líneas para Romanos 12:2.',
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    console.log('\n3. RESPUESTA DE LA IA EN VIVO:\n');
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data));
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}

testAI();
