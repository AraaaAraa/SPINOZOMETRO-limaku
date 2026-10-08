/**
 * Persistencia en localStorage, versionada y a prueba de errores (SSR, modo privado, JSON roto).
 * La interfaz pública es chica a propósito: cuando haya base de datos se reemplaza este archivo
 * por uno que hable con la API y el resto de la app no cambia.
 * Privacidad: del Spinozómetro NO se guardan nombres ni frases, solo el resumen.
 */
import { IevResult } from "./iev";
import { IrcAssessment } from "./irc";
import { PagAssessment } from "./pag";
import { Metric, SpinozometroResult } from "./spinozometro";
import { newId } from "./utils";

const KEY = "limaku:spinozometro:store";
const MAX_HISTORY = 100;

export type SpinozometroRecord = {
  id: string; timestamp: string; total: number; level: number; levelName: string;
  metrics: Record<Metric, number | null>; ier: number; scoringVersion: string;
};
export type IevRecord = IevResult & { id: string; timestamp: string };

export type Store = {
  v: 1;
  userId: string;
  consentDb: boolean; // consentimiento explícito para guardar en servidor (futuro)
  latest: { iev?: number; ier?: number; irc?: number };
  history: { spinozometro: SpinozometroRecord[]; iev: IevRecord[]; irc: IrcAssessment[]; pag: PagAssessment[] };
};

const emptyStore = (): Store => ({
  v: 1, userId: newId(), consentDb: false, latest: {},
  history: { spinozometro: [], iev: [], irc: [], pag: [] },
});

export function loadStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw);
    if (data?.v === 1 && data.history) return data as Store; // futuras migraciones: acá
  } catch { /* JSON roto o acceso bloqueado */ }
  return emptyStore();
}

function persist(s: Store): boolean {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); return true; }
  catch { return false; } // cuota llena o modo privado
}

const push = <T,>(list: T[], item: T): T[] => [item, ...list].slice(0, MAX_HISTORY);

export const getUserId = (): string => {
  const s = loadStore();
  persist(s); // fija el userId anónimo la primera vez
  return s.userId;
};

export function saveSpinozometro(r: SpinozometroResult): boolean {
  const s = loadStore();
  const last = s.history.spinozometro[0];
  if (
    last &&
    last.total === r.total &&
    last.level === r.level &&
    last.levelName === r.levelName &&
    last.ier === r.ier &&
    last.scoringVersion === r.scoringVersion &&
    JSON.stringify(last.metrics) === JSON.stringify(r.metrics)
  ) {
    return true;
  }
  const rec: SpinozometroRecord = {
    id: newId(), timestamp: new Date().toISOString(), total: r.total, level: r.level,
    levelName: r.levelName, metrics: r.metrics, ier: r.ier, scoringVersion: r.scoringVersion,
  };
  s.history.spinozometro = push(s.history.spinozometro, rec);
  s.latest.ier = r.ier;
  return persist(s);
}

export function saveIev(r: IevResult): boolean {
  const s = loadStore();
  const last = s.history.iev[0];
  if (last && last.iev === r.iev && JSON.stringify(last.answers) === JSON.stringify(r.answers)) {
    return true;
  }
  s.history.iev = push(s.history.iev, { ...r, id: newId(), timestamp: new Date().toISOString() });
  s.latest.iev = r.iev;
  return persist(s);
}

export function saveIrc(a: IrcAssessment): boolean {
  const s = loadStore();
  if (s.history.irc.some((x) => x.assessment_id === a.assessment_id)) return true;
  s.history.irc = push(s.history.irc, a);
  s.latest.irc = a.results.irc_score;
  return persist(s);
}

export function savePag(a: PagAssessment): boolean {
  const s = loadStore();
  if (s.history.pag.some((x) => x.pag_assessment_id === a.pag_assessment_id)) return true;
  s.history.pag = push(s.history.pag, a);
  return persist(s);
}

/** Para autocompletar la calculadora PAG. */
export const getLatestIndices = () => loadStore().latest;
export const getHistory = () => loadStore().history;

export function deleteHistoryItem(kind: keyof Store["history"], id: string): boolean {
  const s = loadStore();
  const key = kind === "irc" ? "assessment_id" : kind === "pag" ? "pag_assessment_id" : "id";
  (s.history[kind] as Record<string, unknown>[]) = (s.history[kind] as Record<string, unknown>[]).filter((x) => x[key] !== id);
  return persist(s);
}

export function setConsentDb(consent: boolean): boolean {
  const s = loadStore();
  s.consentDb = consent;
  return persist(s);
}

export const exportStoreJson = (): string => JSON.stringify(loadStore(), null, 2);

export function clearStore(): void {
  try { window.localStorage.removeItem(KEY); } catch { /* nada */ }
}