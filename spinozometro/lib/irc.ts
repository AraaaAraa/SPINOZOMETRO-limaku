import { newId, round2 } from "./utils";

export const IRC_ITEMS = [
  { key: "I1_afectos_pasivos", title: "Transformación de afectos pasivos", low: "Reacción impulsiva", high: "Pausa consciente y reencuadre" },
  { key: "I2_causalidad_interna", title: "Causalidad interna", low: "Arrastre por mandato externo", high: "Convicción propia" },
  { key: "I3_discernimiento", title: "Discernimiento de límites", low: "Energía en lo incontrolable", high: "Foco en lo modificable" },
  { key: "I4_coherencia", title: "Coherencia y autonomía", low: "Brecha entre saber y hacer", high: "Ejecución consistente" },
] as const;

export type IrcScores = {
  I1_afectos_pasivos: number;
  I2_causalidad_interna: number;
  I3_discernimiento: number;
  I4_coherencia: number;
};

export type IrcState = "Servidumbre Emocional" | "Transición Racional" | "Libertad Spinoziana";

export const IRC_LEVELS: { min: number; state: IrcState; color: string; message: string }[] = [
  {
    min: 8.0,
    state: "Libertad Spinoziana",
    color: "#38A169",
    message:
      "Tu autoevaluación muestra buena capacidad de pausa, convicción propia y coherencia entre lo que sabés y lo que hacés. Es una lectura personal y reflexiva, no un diagnóstico ni una evaluación de desempeño. Seguí cuidando tus espacios de reflexión.",
  },
  {
    min: 5.0,
    state: "Transición Racional",
    color: "#DD6B20",
    message:
      "Ya hay momentos de pausa y criterio propio, y otros en los que la reacción gana. Elegí un hábito concreto (por ejemplo, nombrar la emoción antes de actuar) y repetilo durante esta semana.",
  },
  {
    min: 0,
    state: "Servidumbre Emocional",
    color: "#E53E3E",
    message:
      "Hoy tus afectos parecen llevar el timón más que tu criterio. No es un defecto: es un punto de partida muy común. Probá hacer una pausa antes de responder y anotá qué parte de la situación depende de vos.",
  },
];

export function validateIrcScores(scores: IrcScores): string | null {
  for (const item of IRC_ITEMS) {
    const v = scores[item.key];
    if (!Number.isInteger(v) || v < 1 || v > 10) {
      return `"${item.title}" debe ser un número entero entre 1 y 10.`;
    }
  }
  return null;
}

export function calcIrc(scores: IrcScores): number {
  const err = validateIrcScores(scores);
  if (err) throw new Error(err);
  const v = Object.values(scores) as number[];
  return round2(v.reduce((s, x) => s + x, 0) / v.length);
}

export function classifyIrc(irc: number) {
  return IRC_LEVELS.find((l) => irc >= l.min)!;
}

export type IrcAssessment = {
  assessment_id: string;
  user_id: string;
  timestamp: string; // ISO UTC
  scores: IrcScores;
  results: { irc_score: number; state: IrcState; color_code: string };
};

export function buildIrcAssessment(
  scores: IrcScores,
  userId: string,
  now: Date = new Date()
): IrcAssessment {
  const irc = calcIrc(scores);
  const level = classifyIrc(irc);
  return {
    assessment_id: newId(),
    user_id: userId,
    timestamp: now.toISOString(),
    scores: { ...scores },
    results: { irc_score: irc, state: level.state, color_code: level.color },
  };
}