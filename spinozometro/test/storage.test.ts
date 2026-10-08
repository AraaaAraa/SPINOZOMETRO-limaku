import test from "node:test";
import assert from "node:assert/strict";

const mem = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return mem.size;
  },
  clear: () => void mem.clear(),
  getItem: (k: string) => mem.get(k) ?? null,
  key: (index: number) => Array.from(mem.keys())[index] ?? null,
  removeItem: (k: string) => void mem.delete(k),
  setItem: (k: string, v: string) => void mem.set(k, v),
};
const mockWindow = { localStorage: localStorageMock } as Window & typeof globalThis;
Object.defineProperty(globalThis, "window", { value: mockWindow, writable: true, configurable: true });

import { loadStore, saveIev, saveIrc, savePag, saveSpinozometro, getLatestIndices, getUserId, clearStore, deleteHistoryItem, getHistory } from "../lib/storage";
import { buildIevResult } from "../lib/iev";
import { buildIrcAssessment } from "../lib/irc";
import { buildPagAssessment } from "../lib/pag";
import { scoreSpinozometro } from "../lib/spinozometro";

test("storage: guarda, autocompleta y borra", () => {
  clearStore();
  const uid = getUserId();
  assert.equal(getUserId(), uid); // estable
  const iev = buildIevResult([4, 4, 4, 4, 4]);
  saveIev(iev);
  saveIev(iev);
  assert.equal(getHistory().iev.length, 1);
  const mk = (n: number) => ({ I1_afectos_pasivos: n, I2_causalidad_interna: n, I3_discernimiento: n, I4_coherencia: n });
  const irc = buildIrcAssessment(mk(7), uid);
  saveIrc(irc);
  saveIrc(irc);
  assert.equal(getHistory().irc.length, 1);
  const sp = scoreSpinozometro(
    ["a", "b", "c", "d", "e"].map((texto) => ({ texto, valor: 1 as const })),
    ["a", "b", "c", "d", "e"].map((n) => ({ nombre: n, frase: "x", valor: 1 as const }))
  );
  saveSpinozometro(sp);
  saveSpinozometro(sp);
  assert.equal(getHistory().spinozometro.length, 1);
  assert.deepEqual(getLatestIndices(), { iev: 7.75, irc: 7, ier: sp.ier });
  const pag = buildPagAssessment({ iev: 7.75, ier: sp.ier, irc: 7 }, uid);
  savePag(pag);
  savePag(pag);
  assert.equal(getHistory().pag.length, 1);
  // privacidad: no se guardan nombres ni frases del Spinozómetro
  assert.ok(!JSON.stringify(loadStore().history.spinozometro).includes('"frase"'));
  deleteHistoryItem("pag", pag.pag_assessment_id);
  assert.equal(getHistory().pag.length, 0);
  clearStore();
  assert.deepEqual(getLatestIndices(), {});
});

test("storage: JSON corrupto no rompe", () => {
  mem.set("limaku:spinozometro:store", "{no es json");
  assert.equal(loadStore().v, 1);
  assert.deepEqual(loadStore().latest, {});
});