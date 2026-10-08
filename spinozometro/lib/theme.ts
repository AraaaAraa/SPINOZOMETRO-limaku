/** Un color por índice, según la infografía del PAG. */
export const INDEX_COLORS = {
  IEV: "#2B6CB0", // azul
  IER: "#DD6B20", // naranja
  IRC: "#38A169", // verde
  PAG: "#0e6a8f", // celeste
} as const;

export type IndexKey = "IEV" | "IER" | "IRC";

export const INDEX_LABELS: Record<IndexKey, string> = {
  IEV: "Energía Vital (Conatus)",
  IER: "Entorno y Redes (afectos externos)",
  IRC: "Razón y Causalidad (Intellectus)",
};