import test from "node:test";
import assert from "node:assert/strict";
import { parseIndex } from "../lib/validation";
import { ievFromAnswers } from "../lib/iev";
import { ierFromScore100 } from "../lib/ier";
import { buildIrcAssessment, calcIrc, classifyIrc } from "../lib/irc";
import { buildPagAssessment, calcPag, limitingFactors, pagLevel, balancedEquivalent } from "../lib/pag";
import { classifyText, PERSON_LEXICON, scoreSpinozometro, rankingLevel } from "../lib/spinozometro";

test("parseIndex", () => {
  assert.deepEqual(parseIndex("7,5"), { ok: true, value: 7.5 });
  assert.equal(parseIndex("10.01").ok, false);
  assert.equal(parseIndex("0.99").ok, false);
  assert.equal(parseIndex("7.555").ok, false);
  assert.equal(parseIndex("abc").ok, false);
  assert.deepEqual(parseIndex(10), { ok: true, value: 10 });
});

test("IEV", () => {
  assert.equal(ievFromAnswers([1, 1, 1, 1, 1]), 1);
  assert.equal(ievFromAnswers([5, 5, 5, 5, 5]), 10);
  assert.equal(ievFromAnswers([3, 3, 3, 3, 3]), 5.5);
  assert.throws(() => ievFromAnswers([1, 2, 3]));
  assert.throws(() => ievFromAnswers([0, 1, 1, 1, 1]));
});

test("IER", () => {
  assert.equal(ierFromScore100(0), 1);
  assert.equal(ierFromScore100(100), 10);
  assert.equal(ierFromScore100(57), 6.13);
});

test("IRC clasificación y JSON", () => {
  const mk = (n: number) => ({ I1_afectos_pasivos: n, I2_causalidad_interna: n, I3_discernimiento: n, I4_coherencia: n });
  assert.equal(classifyIrc(calcIrc(mk(4))).state, "Servidumbre Emocional");
  assert.equal(classifyIrc(4.99).state, "Servidumbre Emocional");
  assert.equal(classifyIrc(5).state, "Transición Racional");
  assert.equal(classifyIrc(7.99).state, "Transición Racional");
  assert.equal(classifyIrc(calcIrc(mk(8))).state, "Libertad Spinoziana");
  const a = buildIrcAssessment(mk(8), "u1", new Date("2026-10-06T12:00:00Z"));
  assert.equal(a.timestamp, "2026-10-06T12:00:00.000Z");
  assert.equal(a.results.color_code, "#38A169");
  assert.match(a.assessment_id, /^[0-9a-f-]{36}$/);
  assert.throws(() => calcIrc({ ...mk(5), I1_afectos_pasivos: 11 }));
  assert.ok(!JSON.stringify(a).toLowerCase().includes("liderazgo"));
});

test("PAG", () => {
  assert.equal(calcPag({ iev: 7, ier: 7, irc: 7 }), 3.43);
  assert.equal(pagLevel(3.43).name, "Potencia Reactiva");
  assert.equal(calcPag({ iev: 1, ier: 1, irc: 1 }), 0.01);
  assert.equal(calcPag({ iev: 10, ier: 10, irc: 10 }), 10);
  assert.equal(pagLevel(0.01).name, "Potencia Crítica");
  assert.equal(pagLevel(2.5).name, "Potencia Reactiva");
  assert.equal(pagLevel(5).name, "Potencia Sostenible");
  assert.equal(pagLevel(8).name, "Potencia Activa Soberana");
  assert.equal(pagLevel(calcPag({ iev: 9.3, ier: 9.3, irc: 9.3 })).name, "Potencia Activa Soberana");
  assert.deepEqual(limitingFactors({ iev: 6, ier: 8, irc: 9 }), ["IEV"]);
  assert.deepEqual(limitingFactors({ iev: 6, ier: 6, irc: 9 }), ["IEV", "IER"]);
  assert.equal(balancedEquivalent(3.43), 7);
  const a = buildPagAssessment({ iev: "7,5", ier: 6, irc: "8.25" }, "u1");
  assert.equal(a.components.iev, 7.5);
  assert.equal(a.results.pag_score, 3.71);
  assert.throws(() => buildPagAssessment({ iev: 11, ier: 6, irc: 6 }, "u1"));
});

test("Spinozómetro: clasificación de frases", () => {
  const c = (f: string) => classifyText(f, PERSON_LEXICON);
  assert.equal(c("Escucha").status, "positivo");
  assert.equal(c("No escucha").status, "negativo");
  assert.equal(c("Critica").status, "negativo");
  assert.equal(c("Me impulsa").status, "positivo");
  assert.equal(c("Coopera cuando quiere").status, "ambivalente");
  assert.equal(c("Coopera cuando conviene").status, "ambivalente");
  assert.equal(c("Señala").status, "sin_clasificar");
  assert.equal(c("No critica").status, "positivo");
  assert.equal(c("Me escucha pero me critica").status, "ambivalente");
});

const personas = [
  { nombre: "Mama", frase: "Escucha" }, { nombre: "Araceli", frase: "Me impulsa" },
  { nombre: "Sara", frase: "Critica" }, { nombre: "Daniel", frase: "Coopera cuando quiere" },
  { nombre: "Fatima", frase: "No escucha" },
];
const w = (...t: string[]) => t.map((texto) => ({ texto }));

test("Spinozómetro: caso de las capturas", () => {
  const r = scoreSpinozometro(w("Casa", "Comida", "Arte", "Musica", "Familia"), personas);
  assert.deepEqual(r.disminuye, ["Sara", "Fatima"]); // Fatima ya NO figura como constructiva
  assert.deepEqual(r.ambivalentes, ["Daniel"]);
  assert.deepEqual(r.sinClasificar, ["Casa", "Comida", "Familia"]);
  assert.equal(r.total, 60);
  assert.equal(r.level, 4);
});

test("Spinozómetro: las palabras SÍ cambian el resultado", () => {
  const a = scoreSpinozometro(w("Casa", "Comida", "Arte", "Musica", "Familia"), personas);
  const b = scoreSpinozometro(w("Miedo", "Culpa", "Celos", "Control", "Bloqueo"), personas);
  assert.notEqual(a.total, b.total);
  assert.ok(b.total < a.total);
});

test("Spinozómetro: función pura y override manual", () => {
  const p = w("Casa", "Comida", "Arte", "Musica", "Familia");
  assert.deepEqual(scoreSpinozometro(p, personas), scoreSpinozometro(p, personas));
  const m = scoreSpinozometro(p.map((x) => ({ ...x, valor: 1 as const })), personas);
  assert.equal(m.sinClasificar.length, 0);
  assert.equal(m.total, 75);
});

test("Spinozómetro: validación, métricas y ranking", () => {
  assert.throws(() => scoreSpinozometro(w("a", "b", "c", "d", ""), personas));
  const r = scoreSpinozometro(w("Casa", "Comida", "Arte", "Musica", "Familia"), personas);
  assert.ok(Object.values(r.metrics).every((v) => v === null || (v >= 0 && v <= 100)));
  assert.equal(rankingLevel(0), 1); assert.equal(rankingLevel(19), 1);
  assert.equal(rankingLevel(20), 2); assert.equal(rankingLevel(99), 5); assert.equal(rankingLevel(100), 5);
  assert.match(r.recomendacion, /Sara y Fatima/);
});