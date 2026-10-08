"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, HeartPulse } from "lucide-react";
import { Btn, Card, Page } from "@/components/ui";
import { buildIevResult, IEV_PERIOD, IEV_QUESTIONS, IEV_SCALE_LABELS, IevResult } from "@/lib/iev";
import { saveIev } from "@/lib/storage";

export default function IevPage() {
  const [a, setA] = useState<number[]>(Array(5).fill(0));
  const [res, setRes] = useState<IevResult | null>(null);
  const [saved, setSaved] = useState(false);
  const savingAndRouting = useRef(false);
  const router = useRouter();

  const saveAndGoToPag = () => {
    if (!res || savingAndRouting.current) return;
    savingAndRouting.current = true;
    const ok = saved || saveIev(res);
    setSaved(ok);
    if (ok) router.push("/pag");
    else savingAndRouting.current = false;
  };

  return (
    <Page title="Índice de Energía Vital (IEV)" sub={`Conatus: la fuerza interna para perseverar. Respondé pensando ${IEV_PERIOD}.`}>
      <div className="mb-4 flex justify-center gap-3 text-iev"><Dumbbell /><HeartPulse /></div>
      <div className="space-y-3">
        {IEV_QUESTIONS.map((q, i) => (
          <Card key={q.id} className="border-iev/40">
            <p className="font-semibold">{i + 1}. {q.text}</p>
            <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label={q.text}>
              {IEV_SCALE_LABELS.map((l, v) => (
                <button key={l} role="radio" aria-checked={a[i] === v + 1} onClick={() => { setA(a.map((x, j) => (j === i ? v + 1 : x))); setRes(null); setSaved(false); savingAndRouting.current = false; }}
                  className={`rounded-lg border px-1 py-2 text-xs font-semibold ${a[i] === v + 1 ? "border-iev bg-iev text-white" : "border-sky-200 bg-white"}`}>
                  {v + 1}<br />{l}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 text-center"><Btn primary disabled={!a.every(Boolean)} onClick={() => { setRes(buildIevResult(a)); savingAndRouting.current = false; }}>Calcular mi IEV</Btn></div>
      {res && (
        <Card className="mt-6 border-iev text-center">
          <p className="text-sm">Tu Índice de Energía Vital</p>
          <p className="text-5xl font-bold text-iev">{res.iev.toFixed(2).replace(".", ",")}<span className="text-lg"> / 10</span></p>
          <div className="mx-auto my-3 h-2 max-w-xs rounded bg-slate-200"><div className="h-2 rounded bg-iev" style={{ width: `${((res.iev - 1) / 9) * 100}%` }} /></div>
          <p className="text-xs text-slate-600">Si hace tiempo te sentís sin fuerzas, conversalo con un profesional de la salud.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Btn primary onClick={saveAndGoToPag}>Guardar y calcular mi PAG</Btn>
            <Link href="/pag" className="rounded-full border border-boton px-5 py-2 text-sm font-bold text-boton">Calcular mi PAG</Link>
          </div>
        </Card>
      )}
    </Page>
  );
}