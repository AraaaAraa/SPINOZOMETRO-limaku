import { round2 } from "./utils";

/** Cuestionario IEV (propuesto): escala 1-5, "en las últimas dos semanas". */
export const IEV_QUESTIONS = [
  { id: "E1_cuerpo", text: "¿Cuánta energía física sentiste para tu día a día?", indicador: "Vitalidad física" },
  { id: "E2_descanso", text: "¿Cuánto te recuperaste después de esforzarte (sueño, pausas)?", indicador: "Vitalidad física" },
  { id: "E3_animo", text: "¿Cómo fue tu disposición emocional general?", indicador: "Disposición emocional" },
  { id: "E4_deseo", text: "¿Cuántas ganas tuviste de empezar cosas que te importan?", indicador: "Disposición emocional" },
  { id: "E5_decision", text: "¿Cuántas veces pasaste de la intención a la acción por decisión propia?", indicador: "Ímpetu de actuar" },
] as const;

export const IEV_SCALE_LABELS = ["Nada", "Poco", "Algo", "Bastante", "Mucho"] as const;
export const IEV_PERIOD = "en las últimas dos semanas";

export type IevResult = {
  answers: Record<string, number>;
  iev: number;
};

/** answers: 5 valores enteros 1-5, en el orden de IEV_QUESTIONS. Devuelve IEV 1.00-10.00. */
export function ievFromAnswers(answers: number[]): number {
  if (
    answers.length !== IEV_QUESTIONS.length ||
    answers.some((a) => !Number.isInteger(a) || a < 1 || a > 5)
  ) {
    throw new Error("IEV: se esperan 5 respuestas enteras entre 1 y 5.");
  }
  const mean = answers.reduce((s, a) => s + a, 0) / answers.length;
  return round2(1 + (9 * (mean - 1)) / 4);
}

export function buildIevResult(answers: number[]): IevResult {
  const iev = ievFromAnswers(answers);
  return {
    answers: Object.fromEntries(IEV_QUESTIONS.map((q, i) => [q.id, answers[i]])),
    iev,
  };
}