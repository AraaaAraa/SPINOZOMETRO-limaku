import { round2 } from "./utils";

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * Valida un índice entre 1.00 y 10.00 con hasta 2 decimales.
 * Acepta coma o punto ("7,5" y "7.5"), como se escribe en Argentina.
 */
export function parseIndex(input: string | number): ParseResult {
  const raw = typeof input === "number" ? String(input) : input.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(raw)) {
    return { ok: false, error: "Ingresá un número entre 1,00 y 10,00 con hasta 2 decimales." };
  }
  const value = Number(raw);
  if (value < 1 || value > 10) {
    return { ok: false, error: "El valor debe estar entre 1,00 y 10,00." };
  }
  return { ok: true, value: round2(value) };
}