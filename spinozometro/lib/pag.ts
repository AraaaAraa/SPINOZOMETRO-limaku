import { IndexKey } from "./theme";
import { newId, round2 } from "./utils";
import { parseIndex } from "./validation";

export const PAG_FORMULA_TEXT = "PAG = (Energía Vital × Entorno × Razón) / 100";
export const PAG_IMPACT_TEXT =
  "Una alta PAG permite aumentar tu poder de actuar, vivir con Alegría spinoziana y potenciar a otros.";

/** Cortes definidos por el empleador. Único lugar donde se tocan. */
export const PAG_LEVELS = [
  { min: 8.0, name: "Potencia Activa Soberana", message: "Tus tres ejes se sostienen entre sí: hay energía, un entorno que suma y criterio propio. El desafío es cuidar ese equilibrio y compartirlo." },
  { min: 5.0, name: "Potencia Sostenible", message: "Tenés una base firme. Mejorar el eje más bajo es lo que más puede elevar el conjunto." },
  { min: 2.5, name: "Potencia Reactiva", message: "Tu potencia responde a lo que pasa más de lo que lo orienta. Trabajar el eje prioritario puede cambiar bastante el resultado." },
  { min: 0, name: "Potencia Crítica", message: "Es un punto de partida, no un veredicto. Como el modelo es multiplicativo, un solo eje bajo pesa mucho en el total: empezá por ese." },
] as const;

export type PagLevelName = (typeof PAG_LEVELS)[number]["name"];

export type PagComponents = { iev: number; ier: number; irc: number };

export function calcPag({ iev, ier, irc }: PagComponents): number {
  return round2((iev * ier * irc) / 100);
}

/** Se clasifica sobre el valor redondeado, el mismo que ve la persona. */
export function pagLevel(pag: number) {
  return PAG_LEVELS.find((l) => pag >= l.min)!;
}

/** Eje(s) más bajo(s). Si hay empate, devuelve todos los empatados. */
export function limitingFactors(c: PagComponents): IndexKey[] {
  const entries: [IndexKey, number][] = [
    ["IEV", round2(c.iev)],
    ["IER", round2(c.ier)],
    ["IRC", round2(c.irc)],
  ];
  const min = Math.min(...entries.map(([, v]) => v));
  return entries.filter(([, v]) => v === min).map(([k]) => k);
}

/** Informativo: perfil parejo equivalente (media geométrica). Ej.: PAG 3.43 ≈ 7.00 en cada eje. */
export const balancedEquivalent = (pag: number): number =>
  round2(Math.cbrt(pag * 100));

export type PagAssessment = {
  pag_assessment_id: string;
  user_id: string;
  timestamp: string;
  components: PagComponents;
  results: { pag_score: number; diagnostic_level: PagLevelName; limiting_factor: IndexKey[] };
};

export function buildPagAssessment(
  input: { iev: number | string; ier: number | string; irc: number | string },
  userId: string,
  now: Date = new Date()
): PagAssessment {
  const parsed = (["iev", "ier", "irc"] as const).map((k) => {
    const r = parseIndex(input[k]);
    if (!r.ok) throw new Error(`${k.toUpperCase()}: ${r.error}`);
    return r.value;
  });
  const components: PagComponents = { iev: parsed[0], ier: parsed[1], irc: parsed[2] };
  const pag = calcPag(components);
  return {
    pag_assessment_id: newId(),
    user_id: userId,
    timestamp: now.toISOString(),
    components,
    results: {
      pag_score: pag,
      diagnostic_level: pagLevel(pag).name,
      limiting_factor: limitingFactors(components),
    },
  };
}