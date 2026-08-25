import 'dotenv/config';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const FORBIDDEN_MOCK_STRINGS = [
  "no de un capítulo prestado",
  "Exposición asistida",
  "la doctrina se ancla al versículo",
  "consigna genérica de otro libro"
];

const results = [];

async function runTest(testName, testFn) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name: testName, status: 'PASS', duration: `${duration}ms` });
    console.log(`\x1b[32m✔ PASS\x1b[0m [${duration}ms] - ${testName}`);
  } catch (err) {
    const duration = Date.now() - start;
    results.push({ name: testName, status: 'FAIL', duration: `${duration}ms`, error: err.message });
    console.log(`\x1b[31m✖ FAIL\x1b[0m [${duration}ms] - ${testName}`);
    console.log(`  └─> \x1b[33mError:\x1b[0m ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoMocks(text) {
  for (const forbidden of FORBIDDEN_MOCK_STRINGS) {
    if (text.includes(forbidden)) {
      throw new Error(`Se detectó texto estático/mock prohibido en la respuesta: "${forbidden}"`);
    }
  }
}

async function startQA() {
  console.log(`\n==================================================`);
  console.log(`🔬 INICIANDO AUDITORÍA INTEGRAL DE QA BACKEND`);
  console.log(`Servidor objetivo: ${BASE_URL}`);
  console.log(`==================================================\n`);

  // TEST 1: Variable de entorno API KEY
  await runTest('1. Verificación de GEMINI_API_KEY en entorno', async () => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    assert(key && key.length > 20, 'GEMINI_API_KEY ausente o inválida en el archivo .env');
  });

  // TEST 2: Endpoint de Pasajes Bíblicos
  await runTest('2. GET /api/pasaje (Carga de texto bíblico dinámica)', async () => {
    const res = await fetch(`${BASE_URL}/api/pasaje?libro=Mateo&capitulo=16&version=RVR1960`);
    assert(res.status === 200, `Status HTTP esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'El campo success debe ser true');
    assert(Array.isArray(data.verses) && data.verses.length > 0, 'No se retornó la lista de versículos');
  });

  // TEST 3: Lente Cristocéntrica & Gracia (Respuesta Viva de Gemini o Fallback de Alta Densidad)
  await runTest('3. POST /api/study-engine [Lente Cristocéntrica]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Romanos 12:2',
        mode: 'lens',
        lensTitle: 'Lente Cristocéntrica & Gracia',
        prompt: 'Analiza la centralidad de Cristo'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 100, 'Respuesta demasiado corta o vacía');
    assertNoMocks(data.answer);
  });

  // TEST 4: Lente de Metanoia & Neuroplasticidad (Diferenciación de contenido)
  await runTest('4. POST /api/study-engine [Lente Metanoia en 2 Pedro 1:21]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: '2 Pedro 1:21',
        mode: 'lens',
        lensTitle: 'Lente de Metanoia & Neuroplasticidad',
        prompt: 'Analiza la transformación mental'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assertNoMocks(data.answer);
    assert(data.answer.toLowerCase().includes('mente') || data.answer.toLowerCase().includes('pensamiento') || data.answer.toLowerCase().includes('espíritu') || data.answer.toLowerCase().includes('nous'), 'La respuesta no refleja la temática de metanoia');
  });

  // TEST 5: Exposición de Autor Clásico (corpus real; nunca voz imitada)
  await runTest('5. POST /api/commentary [Spurgeon corpus: Lucas 15:18 hit + Mateo 16:2 miss honesto]', async () => {
    const hit = await fetch(`${BASE_URL}/api/commentary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Lucas 15:18',
        author: 'charles-spurgeon',
        verseText: 'Me levantaré e iré a mi padre, y le diré: Padre, he pecado contra el cielo y contra ti.',
      }),
    });
    assert(hit.status === 200, `Status HTTP ${hit.status}`);
    const hitData = await hit.json();
    assert(hitData.success === true, 'Fallo en success');
    assert(hitData.found === true, 'Debe haber nota real de Spurgeon en Lucas 15:18');
    assert(hitData.text && hitData.text.length > 120, 'Exposición insuficiente');
    assert(/corpus:charles-spurgeon/.test(String(hitData.source || '')), `Fuente inesperada: ${hitData.source}`);
    assertNoMocks(hitData.text);

    const mt = await fetch(`${BASE_URL}/api/commentary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Mateo 9:12',
        author: 'charles-spurgeon',
      }),
    });
    assert(mt.status === 200, `Status HTTP ${mt.status}`);
    const mtData = await mt.json();
    assert(mtData.found === true, 'POST author=charles-spurgeon Mateo 9:12 debe found:true');
    assert(/physician|sick|whole|ἰατρ|iatro/i.test(String(mtData.text || '')), 'La nota de Spurgeon en Mateo 9:12 debe ser la exposición SPE real');
    assert(/corpus:charles-spurgeon/.test(String(mtData.source || '')), `Fuente inesperada: ${mtData.source}`);

    const miss = await fetch(`${BASE_URL}/api/commentary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Mateo 16:2',
        author: 'C. H. Spurgeon',
        verseText: 'Cuando anochece, decís: Buen tiempo; porque el cielo tiene arreboles.',
      }),
    });
    assert(miss.status === 200, `Status HTTP ${miss.status}`);
    const missData = await miss.json();
    assert(missData.success === true, 'Fallo en success');
    assert(missData.found === false, 'Mateo 16:2 no debe inventar una exposición de Spurgeon');
    assert(/No hay nota/.test(String(missData.text || '')), 'El miss debe ser una línea honesta en español');
    assertNoMocks(missData.text);
  });

  // TEST 6: Léxico Strong Dinámico
  await runTest('6. POST /api/study-engine [Léxico Strong en Génesis 48:1]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Génesis 48:1',
        mode: 'lexicon'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assertNoMocks(data.answer);
  });

  // TEST 7: Concordancia Canónica y Temática (Por Pasaje)
  await runTest('7. POST /api/study-engine [Concordancia Doctrinal por Pasaje]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Romanos 12:2',
        mode: 'concordance'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 100, 'Respuesta de concordancia insuficiente');
    assertNoMocks(data.answer);
  });

  // TEST 8: Concordancia Bíblica Exhaustiva (Por Término Clave)
  await runTest('8. POST /api/concordance [Concordancia por Término Clave "Gracia"]', async () => {
    const res = await fetch(`${BASE_URL}/api/concordance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Efesios 2:8',
        keyword: 'Gracia'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 100, 'Respuesta de concordancia para término insuficiente');
    assertNoMocks(data.answer);
  });

  // TEST 9: POST /api/lente-elite [Dictamen Maestro Integrado (Convergencia Total)]
  await runTest('9. POST /api/lente-elite [Dictamen Maestro Integrado]', async () => {
    const res = await fetch(`${BASE_URL}/api/lente-elite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Romanos 12:2',
        subLensId: 'dictamen_maestro',
        lensTitle: 'Dictamen Maestro Integrado',
        verseText: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento...'
      })
    });
    assert(res.status === 200, `Status HTTP esperado 200, recibido ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'El campo success debe ser true');
    assert(data.answer && data.answer.length > 150, 'Dictamen demasiado corto');
    assert(
      data.answer.includes('I.') || data.answer.includes('II.') || data.answer.includes('III.') || data.answer.includes('IV.'),
      'El dictamen maestro debe contener estructura con números romanos'
    );
    assertNoMocks(data.answer);
  });

  // TEST 10: POST /api/lente-elite [Óptica 1: Exégesis Filológica & Textual]
  await runTest('10. POST /api/lente-elite [Óptica Bíblica: biblica_exegesis]', async () => {
    const res = await fetch(`${BASE_URL}/api/lente-elite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Juan 1:1',
        subLensId: 'biblica_exegesis',
        lensTitle: 'Exégesis Filológica & Textual',
        verseText: 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 120, 'Exégesis demasiado corta');
    assert(
      data.answer.includes('I.') || data.answer.includes('Morfosintáctico') || data.answer.includes('Traducción') || data.answer.includes('Léxico'),
      'La exégesis debe estructurarse rigurosamente con divisiones académicas'
    );
    assertNoMocks(data.answer);
  });

  // TEST 11: POST /api/lente-elite [Óptica 2: Neurociencia Cognitiva & Sinapsis]
  await runTest('11. POST /api/lente-elite [Óptica Mental: mental_neuro]', async () => {
    const res = await fetch(`${BASE_URL}/api/lente-elite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Romanos 12:2',
        subLensId: 'mental_neuro',
        lensTitle: 'Neurociencia Cognitiva & Sinapsis',
        verseText: '...transformaos por medio de la renovación de vuestro entendimiento...'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 120, 'Análisis neurocientífico insuficiente');
    assert(
      data.answer.toLowerCase().includes('córtex') || data.answer.toLowerCase().includes('sinápt') || data.answer.toLowerCase().includes('cerebr') || data.answer.toLowerCase().includes('patron'),
      'El análisis neurocientífico debe contener vocabulario técnico especializado'
    );
    assertNoMocks(data.answer);
  });

  // TEST 12: POST /api/study-engine [Integración Study Engine con mode: elite_lens]
  await runTest('12. POST /api/study-engine [Integración elite_lens: biblica_cristo]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Gálatas 2:20',
        mode: 'elite_lens',
        subLensId: 'biblica_cristo',
        lensTitle: 'Cristocentrismo & Sola Gratia',
        verseText: 'Con Cristo estoy juntamente crucificado, y ya no vivo yo, mas vive Cristo en mí...'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 120, 'Respuesta cristocéntrica insuficiente');
    assertNoMocks(data.answer);
  });

  // TEST 13: POST /api/study-engine [Integración subLensId: mental_decision]
  await runTest('13. POST /api/study-engine [Integración Matriz Decisional: mental_decision]', async () => {
    const res = await fetch(`${BASE_URL}/api/study-engine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passage: 'Proverbios 3:5-6',
        subLensId: 'mental_decision',
        lensTitle: 'Matriz Decisional Estratégica',
        verseText: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia...'
      })
    });
    assert(res.status === 200, `Status HTTP ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Fallo en success');
    assert(data.answer && data.answer.length > 120, 'Matriz decisional insuficiente');
    assertNoMocks(data.answer);
  });

  console.log(`\n==================================================`);
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`📊 RESULTADOS: ${passed} Aprobadas | ${failed} Fallidas`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

startQA();
