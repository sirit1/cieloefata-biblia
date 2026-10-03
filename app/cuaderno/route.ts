const LIBROS: Record<string, string> = {
  genesis: "genesis", exodo: "exodo", levitico: "levitico", numeros: "numeros", deuteronomio: "deuteronomio",
  josue: "josue", jueces: "jueces", rut: "rut", "1 samuel": "1-samuel", "2 samuel": "2-samuel",
  "1 reyes": "1-reyes", "2 reyes": "2-reyes", "1 cronicas": "1-cronicas", "2 cronicas": "2-cronicas",
  esdras: "esdras", nehemias: "nehemias", ester: "ester", job: "job", salmos: "salmos", salmo: "salmos",
  proverbios: "proverbios", eclesiastes: "eclesiastes", cantares: "cantares", isaias: "isaias",
  jeremias: "jeremias", lamentaciones: "lamentaciones", ezequiel: "ezequiel", daniel: "daniel",
  oseas: "oseas", joel: "joel", amos: "amos", abdias: "abdias", jonas: "jonas", miqueas: "miqueas",
  nahum: "nahum", habacuc: "habacuc", sofonias: "sofonias", hageo: "hageo", zacarias: "zacarias",
  malaquias: "malaquias", mateo: "mateo", marcos: "marcos", lucas: "lucas", juan: "juan",
  hechos: "hechos", romanos: "romanos", "1 corintios": "1-corintios", "2 corintios": "2-corintios",
  galatas: "galatas", efesios: "efesios", filipenses: "filipenses", colosenses: "colosenses",
  "1 tesalonicenses": "1-tesalonicenses", "2 tesalonicenses": "2-tesalonicenses",
  "1 timoteo": "1-timoteo", "2 timoteo": "2-timoteo", tito: "tito", filemon: "filemon",
  hebreos: "hebreos", santiago: "santiago", "1 pedro": "1-pedro", "2 pedro": "2-pedro",
  "1 juan": "1-juan", "2 juan": "2-juan", "3 juan": "3-juan", judas: "judas", apocalipsis: "apocalipsis",
};

function limpio(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function destino(cita: string) {
  const t = limpio(cita);
  const m = t.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!m) return "https://revelatio.app/cuaderno";
  const slug = LIBROS[m[1].trim()];
  if (!slug) return "https://revelatio.app/cuaderno";
  const q = new URLSearchParams({ libro: slug, cap: m[2] });
  if (m[3]) q.set("vs", m[3]);
  return `https://revelatio.app/leer?${q.toString()}`;
}

export function GET(request: Request) {
  const cita = new URL(request.url).searchParams.get("cita") || "";
  return Response.redirect(destino(cita), 302);
}
