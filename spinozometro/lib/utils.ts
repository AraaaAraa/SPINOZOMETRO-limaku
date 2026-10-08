export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

export const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

/** Minúsculas, sin tildes ni ñ (la ñ pasa a n). Para comparar texto libre. */
export const norm = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** ["Ana"] -> "Ana"; ["Ana","Beto"] -> "Ana y Beto"; 3+ -> "A, B y C" */
export function joinEs(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export const DISCLAIMER =
  "Herramienta reflexiva inspirada en la Ética de Spinoza. No es un diagnóstico psicológico.";