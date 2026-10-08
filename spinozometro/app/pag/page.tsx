"use client";
import { descargarPdfPag } from "@/lib/pdf";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import GaugeSemi from "@/components/gaugeSemi";
import { Btn, Card, inp, Page } from "@/components/ui";
import {
  balancedEquivalent,
  buildPagAssessment,
  PAG_FORMULA_TEXT,
  PAG_IMPACT_TEXT,
  PagAssessment,
  pagLevel,
} from "@/lib/pag";
import { getLatestIndices, getUserId, savePag } from "@/lib/storage";
import { INDEX_LABELS, IndexKey } from "@/lib/theme";
import { parseIndex } from "@/lib/validation";

const FIELDS: {
  k: "iev" | "ier" | "irc";
  key: IndexKey;
  href: string;
  c: string;
}[] = [
  { k: "iev", key: "IEV", href: "/iev", c: "border-iev text-iev" },
  { k: "ier", key: "IER", href: "/", c: "border-ier text-ier" },
  { k: "irc", key: "IRC", href: "/irc", c: "border-irc text-irc" },
];

// No ejecuta ninguna suscripción real.
// Solo permite diferenciar servidor de navegador.
const subscribe = () => () => {};

const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const fmtIn = (n?: number) =>
  n === undefined ? "" : n.toString().replace(".", ",");

function PagForm() {
  const [v, setV] = useState(() => {
    const latest = getLatestIndices();

    return {
      iev: fmtIn(latest.iev),
      ier: fmtIn(latest.ier),
      irc: fmtIn(latest.irc),
    };
  });

  const [auto] = useState(() => {
    const latest = getLatestIndices();
    return Boolean(latest.iev || latest.ier || latest.irc);
  });

  const [errs, setErrs] = useState<Record<string, string>>({});
  const [a, setA] = useState<PagAssessment | null>(null);
  const [saved, setSaved] = useState(false);

  const calcular = () => {
    const errors: Record<string, string> = {};

    FIELDS.forEach(({ k }) => {
      const result = parseIndex(v[k]);

      if (!result.ok) {
        errors[k] = result.error;
      }
    });

    setErrs(errors);
    setSaved(false);

    setA(
      Object.keys(errors).length
        ? null
        : buildPagAssessment(v, getUserId()),
    );
  };

  const level = a ? pagLevel(a.results.pag_score) : null;

  return (
    <>
      <Card className="mb-4 border-pag text-center">
        <p className="font-bold">{PAG_FORMULA_TEXT}</p>
        <p className="mt-1 text-sm text-slate-600">
          {PAG_IMPACT_TEXT}
        </p>
      </Card>

      {auto && (
        <p className="mb-2 text-center text-xs text-slate-600">
          Autocompletado con tus últimas mediciones guardadas. Podés editarlo.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {FIELDS.map(({ k, key, href, c }) => (
          <Card key={k} className={`border-2 ${c}`}>
            <label
              htmlFor={`pag-${k}`}
              className="block text-sm font-bold"
            >
              {key} · {INDEX_LABELS[key]}
            </label>

            <input
              id={`pag-${k}`}
              inputMode="decimal"
              className={`${inp} mt-2 text-titulo`}
              placeholder="1,00 a 10,00"
              value={v[k]}
              aria-invalid={Boolean(errs[k])}
              aria-describedby={errs[k] ? `pag-${k}-error` : undefined}
              onChange={(e) => {
                setV({ ...v, [k]: e.target.value });
                setA(null);
                setSaved(false);
                setErrs({ ...errs, [k]: "" });
              }}
            />

            {errs[k] && (
              <p
                id={`pag-${k}-error`}
                role="alert"
                className="mt-1 text-xs text-red-600"
              >
                {errs[k]}
              </p>
            )}

            {!v[k] && (
              <Link
                href={href}
                className="mt-1 inline-block text-xs underline"
              >
                No lo tengo: medirlo
              </Link>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Btn primary onClick={calcular}>
          Calcular PAG
        </Btn>
      </div>

      {a && level && (
        <Card className="mt-6">
          <GaugeSemi
            value={a.results.pag_score}
            min={0}
            max={10}
            leftLabel="Superación de la servidumbre"
            rightLabel="Hacia la libertad"
          />

          <p className="mt-3 text-center text-xl font-bold">
            {level.name}
          </p>

          <p className="mt-1 text-center text-sm">
            {level.message}
          </p>

          <p className="mt-1 text-center text-xs text-slate-600">
            Equivale a un perfil parejo de{" "}
            {balancedEquivalent(a.results.pag_score)
              .toFixed(2)
              .replace(".", ",")}{" "}
            en los tres índices.
          </p>

          <div
            role="alert"
            className="mt-4 rounded-xl border-l-8 border-orange-500 bg-orange-50 p-3 text-sm"
          >
            <b>Eje prioritario de intervención:</b>{" "}
            {a.results.limiting_factor
              .map((factor: IndexKey) => INDEX_LABELS[factor])
              .join(" y ")}
            {a.results.limiting_factor.length === 3 &&
              " (los tres ejes empatan)"}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn
              primary
              onClick={() => setSaved(savePag(a))}
              disabled={saved}
            >
              {saved ? "Guardado" : "Guardar medición"}
            </Btn>

            <Btn onClick={() => descargarPdfPag(a)}>Descargar PDF</Btn>
            <Btn onClick={() => window.print()}>Imprimir</Btn>
          </div>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Evaluación y mejora de personas
      </p>
    </>
  );
}

export default function PagPage() {
  const isClient = useIsClient();

  return (
    <Page
      title="Calculadora PAG"
      sub="Potencia Activa Global: la síntesis de tus tres índices."
    >
      {isClient && <PagForm />}
    </Page>
  );
}