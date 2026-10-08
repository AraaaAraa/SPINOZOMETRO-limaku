/**
 * SPINOZÓMETRO — cálculo PROVISORIO (v0.1).
 * Todo el criterio de puntaje vive en este archivo para poder corregirlo sin tocar la UI.
 * - Sin IA: diccionario de raíces + negación + condicionales. Todo ocurre en el navegador.
 * - Función pura: el resultado se recalcula SIEMPRE desde las entradas actuales
 *   (palabras y personas cuentan por igual).
 * - Lo que no se puede clasificar NO se esconde: queda como "sin_clasificar" y se informa.
 */
import { ierFromScore100 } from "./ier";
import { clamp, joinEs, mean, norm } from "./utils";

export const SCORING_VERSION = "0.1-provisional";

export type Metric = "alegria" | "autonomia" | "comprension" | "cooperacion";
export const METRICS: Metric[] = ["alegria", "autonomia", "comprension", "cooperacion"];
export const METRIC_LABELS: Record<Metric, string> = {
  alegria: "Alegría", autonomia: "Autonomía", comprension: "Comprensión", cooperacion: "Cooperación",
};

export type Polarity = -1 | 0 | 1;
export type Status = "positivo" | "negativo" | "ambivalente" | "neutro" | "sin_clasificar";

type Entry = { stem: string; polarity: 1 | -1; metrics: Metric[] };
const P = (stem: string, metrics: Metric[]): Entry => ({ stem, polarity: 1, metrics });
const N = (stem: string, metrics: Metric[]): Entry => ({ stem, polarity: -1, metrics });

// Raíces SIN tildes ni ñ (el texto se normaliza antes de comparar).
export const PERSON_LEXICON: Entry[] = [
  P("escuch", ["comprension"]), P("impuls", ["alegria", "autonomia"]), P("apoy", ["cooperacion", "alegria"]),
  P("ayud", ["cooperacion"]), P("cooper", ["cooperacion"]), P("acompan", ["cooperacion"]),
  P("respet", ["autonomia"]), P("ensen", ["comprension"]), P("motiv", ["alegria"]),
  P("comprend", ["comprension"]), P("confi", ["autonomia", "cooperacion"]), P("valor", ["autonomia"]),
  P("anim", ["alegria"]), P("inspir", ["alegria", "autonomia"]), P("aconsej", ["comprension"]),
  P("alegr", ["alegria"]), P("dialog", ["comprension", "cooperacion"]), P("suma", ["cooperacion"]),
  N("critic", ["autonomia"]), N("juzg", ["comprension"]), N("control", ["autonomia"]),
  N("manipul", ["autonomia"]), N("culp", ["alegria", "autonomia"]), N("agred", ["alegria"]),
  N("grit", ["alegria"]), N("humill", ["alegria", "autonomia"]), N("ignor", ["comprension", "cooperacion"]),
  N("bloque", ["autonomia"]), N("exig", ["autonomia"]), N("castig", ["alegria"]),
  N("descalific", ["autonomia"]), N("presion", ["autonomia"]), N("chantaj", ["autonomia"]),
  N("celos", ["alegria", "cooperacion"]), N("desvalor", ["autonomia"]), N("menospreci", ["autonomia"]),
  N("miedo", ["alegria"]), N("quej", ["alegria"]), N("rechaz", ["cooperacion"]),
];

// Palabras: sólo las de carga afectiva clara. "Casa", "Comida" o "Familia" dependen de cada
// persona, por eso quedan "sin_clasificar" salvo que la persona las marque (campo `valor`).
export const WORD_LEXICON: Entry[] = [
  P("libert", ["autonomia", "alegria"]), P("amor", ["alegria", "cooperacion"]), P("alegr", ["alegria"]),
  P("arte", ["alegria", "autonomia"]), P("music", ["alegria"]), P("juego", ["alegria"]),
  P("crea", ["autonomia"]), P("paz", ["alegria"]), P("confian", ["cooperacion", "autonomia"]),
  P("apoy", ["cooperacion"]), P("aprend", ["comprension"]), P("crec", ["comprension", "autonomia"]),
  P("amig", ["cooperacion", "alegria"]), P("dialog", ["comprension", "cooperacion"]),
  P("respet", ["autonomia", "cooperacion"]), P("gratitud", ["alegria"]), P("curiosid", ["comprension"]),
  N("miedo", ["alegria"]), N("culp", ["alegria", "autonomia"]), N("celos", ["alegria", "cooperacion"]),
  N("control", ["autonomia"]), N("bloque", ["autonomia"]), N("envidia", ["alegria"]),
  N("rencor", ["alegria"]), N("odio", ["alegria"]), N("ansied", ["alegria"]),
  N("obligaci", ["autonomia"]), N("mandato", ["autonomia"]), N("presion", ["autonomia"]),
  N("critic", ["autonomia"]), N("castig", ["alegria"]), N("verguenza", ["alegria"]),
  N("soledad", ["alegria", "cooperacion"]), N("impotenc", ["autonomia"]), N("angusti", ["alegria"]),
];

const NEGATORS = new Set(["no", "nunca", "jamas", "tampoco", "sin"]);
const HEDGE =
  /\b(cuando (quiere|quiero|conviene|le conviene|se le (canta|antoja)|le parece|tiene ganas)|a veces|algunas veces|de vez en cuando|depende)\b/;

function stemMatches(token: string, stem: string): boolean {
  if (token === stem) return true;
  if (stem.length >= 5) return token.startsWith(stem);
  return token.startsWith(stem) && token.length <= stem.length + 1; // raíces cortas: "arte"/"artes"
}

type Classification = { polarity: Polarity; status: Status; metrics: Metric[] };

export function classifyText(text: string, lexicon: Entry[]): Classification {
  const t = norm(text);
  const tokens = t.split(/[^a-z]+/).filter(Boolean);
  const hits: { pol: number; metrics: Metric[] }[] = [];

  tokens.forEach((tok, i) => {
    const e = lexicon.find((x) => stemMatches(tok, x.stem));
    if (!e) return;
    const negated = tokens.slice(Math.max(0, i - 2), i).some((w) => NEGATORS.has(w));
    hits.push({ pol: negated ? -e.polarity : e.polarity, metrics: e.metrics });
  });

  const metrics = [...new Set(hits.flatMap((h) => h.metrics))];
  const hasPos = hits.some((h) => h.pol > 0);
  const hasNeg = hits.some((h) => h.pol < 0);

  if (HEDGE.test(t) || (hasPos && hasNeg)) return { polarity: 0, status: "ambivalente", metrics };
  if (hasPos) return { polarity: 1, status: "positivo", metrics };
  if (hasNeg) return { polarity: -1, status: "negativo", metrics };
  return { polarity: 0, status: "sin_clasificar", metrics: [] };
}

// ---- Entrada / salida ----
export type PalabraInput = { texto: string; valor?: Polarity };            // valor = selector de la persona
export type PersonaInput = { nombre: string; frase: string; valor?: Polarity };

export type ClassifiedItem = {
  tipo: "palabra" | "persona";
  etiqueta: string; // la palabra o el nombre
  texto: string;
  polarity: Polarity;
  status: Status;
  metrics: Metric[];
  manual: boolean;
};

export const RANKING = [
  { level: 1, name: "Pasiones tristes dominantes", desc: "Entorno que principalmente disminuye tu potencia." },
  { level: 2, name: "Potencia disminuida", desc: "Predominan factores que limitan tu poder de obrar." },
  { level: 3, name: "Potencia ambivalente", desc: "Conviven factores que suman y restan." },
  { level: 4, name: "Potencia activa", desc: "Predominan factores que aumentan tu potencia." },
  { level: 5, name: "Potencia expansiva", desc: "El entorno favorece ampliamente tu capacidad de actuar." },
] as const;

export const rankingLevel = (score100: number): 1 | 2 | 3 | 4 | 5 =>
  (Math.min(5, Math.floor(clamp(score100, 0, 100) / 20) + 1) as 1 | 2 | 3 | 4 | 5);

export type SpinozometroResult = {
  scoringVersion: string;
  total: number; // 0-100
  metrics: Record<Metric, number | null>; // null = sin datos
  level: 1 | 2 | 3 | 4 | 5;
  levelName: string;
  ier: number; // 1.00-10.00
  items: ClassifiedItem[];
  aumenta: string[];
  disminuye: string[];
  ambivalentes: string[];
  sinClasificar: string[];
  recomendacion: string;
  invitacion: string;
  comoSeCalculo: string;
};

export function validateSpinozometroInput(
  palabras: PalabraInput[],
  personas: PersonaInput[]
): string | null {
  if (palabras.length !== 5 || palabras.some((p) => !p.texto.trim()))
    return "Completá las 5 palabras.";
  if (personas.length !== 5 || personas.some((p) => !p.nombre.trim() || !p.frase.trim()))
    return "Completá las 5 personas (nombre y frase).";
  return null;
}

const pct = (m: number) => Math.round(clamp(50 + 50 * m, 0, 100));

function classifyItem(
  tipo: "palabra" | "persona", etiqueta: string, texto: string, valor: Polarity | undefined,
  lexicon: Entry[]
): ClassifiedItem {
  const auto = classifyText(texto, lexicon);
  if (valor === undefined) return { tipo, etiqueta, texto, ...auto, manual: false };
  const status: Status = valor > 0 ? "positivo" : valor < 0 ? "negativo" : "neutro";
  return { tipo, etiqueta, texto, polarity: valor, status, metrics: auto.metrics, manual: true };
}

export function scoreSpinozometro(
  palabras: PalabraInput[],
  personas: PersonaInput[]
): SpinozometroResult {
  const err = validateSpinozometroInput(palabras, personas);
  if (err) throw new Error(err);

  const items: ClassifiedItem[] = [
    ...palabras.map((p) => classifyItem("palabra", p.texto.trim(), p.texto, p.valor, WORD_LEXICON)),
    ...personas.map((p) => classifyItem("persona", p.nombre.trim(), p.frase, p.valor, PERSON_LEXICON)),
  ];

  const total = pct(mean(items.map((i) => i.polarity)));
  const metrics = Object.fromEntries(
    METRICS.map((m) => {
      const vals = items.filter((i) => i.metrics.includes(m)).map((i) => i.polarity);
      return [m, vals.length ? pct(mean(vals)) : null];
    })
  ) as Record<Metric, number | null>;

  const level = rankingLevel(total);
  const labels = (f: (i: ClassifiedItem) => boolean) => items.filter(f).map((i) => i.etiqueta);
  const aumenta = labels((i) => i.polarity > 0);
  const disminuye = labels((i) => i.polarity < 0);
  const ambivalentes = labels((i) => i.status === "ambivalente");
  const sinClasificar = labels((i) => i.status === "sin_clasificar");
  const personasAtencion = items.filter((i) => i.tipo === "persona" && i.polarity < 0).map((i) => i.etiqueta);

  return {
    scoringVersion: SCORING_VERSION,
    total, metrics, level, levelName: RANKING[level - 1].name, ier: ierFromScore100(total),
    items, aumenta, disminuye, ambivalentes, sinClasificar,
    recomendacion: buildRecomendacion(level, personasAtencion),
    invitacion: INVITACIONES[level - 1],
    comoSeCalculo:
      "Cada palabra y cada persona suma (+1), resta (−1) o queda neutra (0). El índice es 50 + 50 × el promedio de esos 10 valores. " +
      "Cada métrica usa solo los elementos que la tocan; si ninguno la toca, figura como «sin datos».",
  };
}

const INVITACIONES = [
  "Elegí una sola cosa para cuidar esta semana: un límite, una conversación pendiente o un rato propio. Con una alcanza.",
  "Identificá un vínculo o una palabra que pesa y pensá una pequeña acción para resignificarla o ponerle límites.",
  "Elegí un factor que suma y dale más lugar esta semana: una charla, una actividad o un proyecto que te haga bien.",
  "Convertí una fuente actual de potencia en hábito: coordiná una actividad, conversación o proyecto semanal que sostenga aprendizaje, cooperación o creación.",
  "Compartí lo que te hace bien: invitá a alguien a una actividad o proyecto en común y cuidá tus espacios de reflexión.",
];

function buildRecomendacion(level: number, atencion: string[]): string {
  const base = [
    "Hoy tu entorno parece disminuir tu potencia más de lo que la aumenta. Mirá qué vínculos y palabras pesan más y pensá cuáles podés cuidar, limitar o resignificar.",
    "Predominan factores que limitan tu capacidad de actuar. Ubicar qué los provoca es el primer paso para recuperar margen de decisión.",
    "Conviven factores que suman y restan. Reforzar lo que te impulsa y poner atención a lo que te agota puede inclinar la balanza.",
    "Tu entorno muestra varios factores de apoyo, autonomía y cooperación. El desafío es consolidarlos sin depender de un único vínculo y mantener espacios propios de reflexión y acción.",
    "Tu entorno favorece ampliamente tu capacidad de actuar. El desafío es sostenerlo en el tiempo y compartirlo con otros.",
  ][level - 1];
  return atencion.length
    ? `${base} Prestá especial atención a tu vínculo con ${joinEs(atencion)}.`
    : base;
}