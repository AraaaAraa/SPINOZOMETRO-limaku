"use client";
import { descargarPdfSpinozometro } from "@/lib/pdf";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCog,
  HeartPulse,
  MessagesSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { Btn, Card, Disclaimer, inp } from "@/components/ui";
import { Ring } from "@/components/gaugeSemi";
import {
  METRICS,
  METRIC_LABELS,
  Polarity,
  RANKING,
  scoreSpinozometro,
  validateSpinozometroInput,
} from "@/lib/spinozometro";
import {
  getHistory,
  saveSpinozometro,
  SpinozometroRecord,
} from "@/lib/storage";
import { joinEs } from "@/lib/utils";

type Persona = {
  nombre: string;
  frase: string;
};

const blankP = () => Array<string>(5).fill("");

const blankQ = (): Persona[] =>
  Array.from({ length: 5 }, () => ({
    nombre: "",
    frase: "",
  }));

const LEVEL_BG = [
  "bg-red-200",
  "bg-orange-200",
  "bg-yellow-200",
  "bg-lime-200",
  "bg-green-300",
];

const BLOCKS = [
  {
    href: "/iev",
    t: "Energía Vital",
    s: "Conatus: la fuerza interna para perseverar.",
    Icon: HeartPulse,
    c: "border-iev text-iev",
  },
  {
    href: "#test",
    t: "Entorno: palabras y personas",
    s: "Afectos externos: cómo influyen tus vínculos.",
    Icon: Users,
    c: "border-ier text-ier",
  },
  {
    href: "/irc",
    t: "Razón y Causalidad",
    s: "Intellectus: discernimiento y autonomía.",
    Icon: BrainCog,
    c: "border-irc text-irc",
  },
  {
    href: "/pag",
    t: "PAG",
    s: "La síntesis: tu potencia activa global.",
    Icon: TrendingUp,
    c: "border-pag text-pag",
  },
];

export default function Home() {
  const [palabras, setPalabras] = useState(blankP);
  const [personas, setPersonas] = useState(blankQ);
  const [snap, setSnap] = useState<{
    p: string[];
    q: Persona[];
  } | null>(null);
  const [ov, setOv] = useState<Record<number, Polarity>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const savingAndRouting = useRef(false);
  const router = useRouter();

  // Se inicializa vacío para que servidor y cliente rendericen lo mismo.
  const [hist, setHist] = useState<SpinozometroRecord[]>([]);

  // localStorage solo se consulta después de montar en el navegador.
  useEffect(() => {
    // Se lee localStorage después del montaje para evitar errores de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHist(getHistory().spinozometro);
  }, []);

  const result = useMemo(
    () =>
      snap &&
      scoreSpinozometro(
        snap.p.map((texto, i) => ({
          texto,
          valor: ov[i],
        })),
        snap.q.map((x, i) => ({
          ...x,
          valor: ov[5 + i],
        })),
      ),
    [snap, ov],
  );

  const evaluar = () => {
    const err = validateSpinozometroInput(
      palabras.map((texto) => ({ texto })),
      personas,
    );

    if (err) {
      setError(err);
      return;
    }

    setError("");
    setOv({});
    setSaved(false);
    savingAndRouting.current = false;

    setSnap({
      p: [...palabras],
      q: personas.map((x) => ({ ...x })),
    });

    setTimeout(() => {
      document
        .getElementById("resultado")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const repetir = () => {
    if (
      !confirm(
        "¿Seguro? Se borran los datos cargados (el historial guardado no se toca).",
      )
    ) {
      return;
    }

    setPalabras(blankP());
    setPersonas(blankQ());
    setSnap(null);
    setOv({});
    setError("");
    setSaved(false);
    savingAndRouting.current = false;
  };

  const guardarYCalcularPag = () => {
    if (!result || savingAndRouting.current) return;

    savingAndRouting.current = true;

    const ok = saved || saveSpinozometro(result);

    if (ok) {
      setSaved(true);
      setHist(getHistory().spinozometro);
      router.push("/pag");
    } else {
      savingAndRouting.current = false;
      setError("No se pudo guardar en este navegador.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section id="test">
        <h1 className="text-center text-3xl font-bold">Qué analiza</h1>

        <p className="mb-6 mt-2 text-center text-sm text-slate-600">
          Dos retos simples para observar cómo tu entorno influye en tu vida.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="border-red-200">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MessagesSquare className="h-5 w-5" />
              Reto de las 5 palabras
            </h2>

            <p className="mb-3 text-xs text-slate-600">
              ¿Te generan impulso o represión?
            </p>

            <div className="space-y-2">
              {palabras.map((w, i) => (
                <label key={i} className="flex items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-400 text-xs font-bold text-white">
                    {i + 1}
                  </span>

                  <input
                    className={inp}
                    aria-label={`Palabra ${i + 1}`}
                    value={w}
                    onChange={(e) =>
                      setPalabras(
                        palabras.map((x, j) =>
                          j === i ? e.target.value : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="border-green-200">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5" />
              Reto de las 5 personas
            </h2>

            <p className="mb-3 text-xs text-slate-600">
              ¿Componen o descomponen tu potencia?
            </p>

            <div className="space-y-2">
              {personas.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>

                  <input
                    className={`${inp} w-1/3`}
                    placeholder="Nombre"
                    aria-label={`Nombre ${i + 1}`}
                    value={p.nombre}
                    onChange={(e) =>
                      setPersonas(
                        personas.map((x, j) =>
                          j === i
                            ? { ...x, nombre: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />

                  <input
                    className={inp}
                    placeholder="Frase que la describe"
                    aria-label={`Frase ${i + 1}`}
                    value={p.frase}
                    onChange={(e) =>
                      setPersonas(
                        personas.map((x, j) =>
                          j === i
                            ? { ...x, frase: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-5 text-center">
          {error && (
            <p
              role="alert"
              className="mb-2 text-sm font-semibold text-red-600"
            >
              {error}
            </p>
          )}

          <Btn primary onClick={evaluar}>
            Evaluar mi entorno
          </Btn>
        </div>
      </section>

      {result && (
        <section id="resultado" className="mt-10">
          <Card>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold">
              Nivel {result.level} · {result.levelName}
            </span>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Índice de Potencia del Entorno: {result.total}/100
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Lectura reflexiva inspirada en Spinoza: observa si el entorno
                  que describís tiende a aumentar o disminuir tu capacidad de
                  actuar.
                </p>
              </div>

              <Ring value={result.total} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {METRICS.map((m) => (
                <div
                  key={m}
                  className="rounded-xl border border-sky-200 p-3"
                >
                  <p className="text-sm font-bold">{METRIC_LABELS[m]}</p>

                  <div className="my-1 h-2 rounded bg-slate-200">
                    <div
                      className="h-2 rounded bg-green-500"
                      style={{
                        width: `${result.metrics[m] ?? 0}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs">
                    {result.metrics[m] === null
                      ? "sin datos"
                      : `${result.metrics[m]}%`}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Card>
                <h3 className="font-bold">Lo que aumenta tu potencia</h3>
                <p className="mt-2 text-sm">
                  {result.aumenta.length
                    ? `Aparece como constructivo: ${joinEs(result.aumenta)}.`
                    : "Nada claro por ahora."}
                </p>
              </Card>

              <Card>
                <h3 className="font-bold">Lo que la disminuye</h3>
                <p className="mt-2 text-sm">
                  {result.disminuye.length
                    ? `Requiere atención: ${joinEs(result.disminuye)}.`
                    : "Nada claro por ahora."}
                </p>
              </Card>

              <Card>
                <h3 className="font-bold">Recomendación de mejora</h3>
                <p className="mt-2 text-sm">{result.recomendacion}</p>
              </Card>

              <Card>
                <h3 className="font-bold">Invitación a la acción</h3>
                <p className="mt-2 text-sm">{result.invitacion}</p>
              </Card>
            </div>

            {result.items.some(
              (it) => it.status === "sin_clasificar" || it.manual,
            ) && (
              <Card className="mt-4">
                <h3 className="font-bold">
                  No pude clasificar algunos elementos
                </h3>

                <p className="mb-2 text-sm text-slate-600">
                  Marcá cómo los sentís vos y el índice se recalcula.
                </p>

                {result.items.map(
                  (it, i) =>
                    (it.status === "sin_clasificar" || it.manual) && (
                      <label
                        key={i}
                        className="mb-1 flex items-center justify-between gap-3 text-sm"
                      >
                        <span>
                          {it.etiqueta}
                          {it.tipo === "persona"
                            ? ` («${it.texto}»)`
                            : ""}
                        </span>

                        <select
                          className="rounded-lg border border-sky-200 bg-white px-2 py-1"
                          value={ov[i] ?? ""}
                          onChange={(e) =>
                            setOv({
                              ...ov,
                              [i]: Number(e.target.value) as Polarity,
                            })
                          }
                        >
                          <option value="" disabled>
                            Elegí…
                          </option>
                          <option value={1}>Me suma</option>
                          <option value={0}>Neutro</option>
                          <option value={-1}>Me resta</option>
                        </select>
                      </label>
                    ),
                )}
              </Card>
            )}

            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-bold">
                Cómo se calculó
              </summary>

              <p className="mt-1 text-slate-600">
                {result.comoSeCalculo}
              </p>
            </details>

            <p className="mt-3 text-sm">
              Tu IER derivado:{" "}
              <b>{result.ier.toFixed(2).replace(".", ",")}</b> de 10.{" "}
              <Link href="/pag" className="font-bold text-boton underline">
                Usarlo en el PAG
              </Link>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Btn primary onClick={guardarYCalcularPag}>
                Guardar y calcular mi PAG
              </Btn>

              <Btn onClick={() => descargarPdfSpinozometro(result)}>Descargar PDF</Btn>
              <Btn onClick={() => window.print()}>Imprimir</Btn>
              
              <Btn onClick={repetir}>Repetir test</Btn>
            </div>

            <h3 className="mt-6 font-bold">Historial de evolución</h3>

            {hist.length === 0 ? (
              <p className="text-sm text-slate-600">
                Todavía no guardaste mediciones.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="mt-2 w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="py-1">Fecha</th>
                      <th>Índice</th>
                      <th>Nivel</th>
                    </tr>
                  </thead>

                  <tbody>
                    {hist.map((h) => (
                      <tr
                        key={h.id}
                        className="border-t border-sky-100"
                      >
                        <td className="py-1">
                          {new Date(h.timestamp).toLocaleDateString("es-AR")}
                        </td>
                        <td>{h.total}/100</td>
                        <td>{h.levelName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold">
          Ranking de Potencia
        </h2>

        <p className="mb-4 mt-1 text-center text-sm text-slate-600">
          La app ubica tu medición en una escala de 5 ponderaciones según la
          influencia percibida de tu entorno.
        </p>

        <div className="grid gap-3 md:grid-cols-5">
          {RANKING.map((r) => (
            <div
              key={r.level}
              className={`rounded-xl p-3 text-sm ${
                LEVEL_BG[r.level - 1]
              } ${
                result?.level === r.level
                  ? "ring-2 ring-titulo"
                  : ""
              }`}
            >
              <p className="text-xs">{r.level}</p>
              <p className="font-bold">{r.name}</p>
              <p className="mt-1 text-xs">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 print:hidden">
        <h2 className="text-center text-2xl font-bold">
          Sistema Integral de Potencia Activa Global
        </h2>

        <p className="mb-4 mt-1 text-center text-sm text-slate-600">
          PAG = (Energía Vital × Entorno × Razón) / 100. Completá cada índice y
          obtené tu síntesis.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BLOCKS.map(({ href, t, s, Icon, c }) => (
            <Link
              key={t}
              href={href}
              className={`rounded-2xl border-2 bg-white/70 p-4 ${c}`}
            >
              <Icon className="h-6 w-6" />
              <p className="mt-2 font-bold">{t}</p>
              <p className="mt-1 text-xs text-slate-600">{s}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-100 to-yellow-50 p-8 text-center print:hidden">
        <h2 className="text-3xl font-bold">Tomá el mando de tu vida</h2>

        <p className="mt-2 text-sm">
          Activá tu potencia. Comprendé tu entorno. Elegí vínculos que te hagan
          crecer.
        </p>

        <a
          href="#test"
          className="mt-4 inline-block rounded-full bg-boton px-6 py-2 text-sm font-bold text-white"
        >
          Empezar ahora →
        </a>
      </section>

      <Disclaimer />
    </main>
  );
}