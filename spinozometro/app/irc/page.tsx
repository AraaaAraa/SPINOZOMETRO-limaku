"use client";
import { descargarPdfIrc } from "@/lib/pdf";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, BrainCog, Compass } from "lucide-react";
import GaugeSemi from "@/components/gaugeSemi";
import { Btn, Card, Page } from "@/components/ui";
import { buildIrcAssessment, classifyIrc, IRC_ITEMS, IrcAssessment, IrcScores } from "@/lib/irc";
import { getUserId, saveIrc } from "@/lib/storage";

export default function IrcPage() {
  const [s, setS] = useState<IrcScores>({ I1_afectos_pasivos: 5, I2_causalidad_interna: 5, I3_discernimiento: 5, I4_coherencia: 5 });
  const [a, setA] = useState<IrcAssessment | null>(null);
  const [saved, setSaved] = useState(false);
  const savingAndRouting = useRef(false);
  const router = useRouter();

  const saveAndGoToPag = () => {
    if (!a || savingAndRouting.current) return;
    savingAndRouting.current = true;
    const ok = saved || saveIrc(a);
    setSaved(ok);
    if (ok) router.push("/pag");
    else savingAndRouting.current = false;
  };

  return (
    <Page title="Índice de Razón y Causalidad (IRC)" sub="Intellectus: transformá pasiones en ideas adecuadas. Movés cada control del 1 al 10.">
      <div className="mb-4 flex justify-center gap-3 text-irc"><BrainCog /><Compass /><BookOpen /></div>
      <div className="space-y-3">
        {IRC_ITEMS.map((it) => (
          <Card key={it.key} className="border-irc/40">
            <label className="block">
              <span className="flex justify-between font-semibold"><span>{it.title}</span><span className="text-irc">{s[it.key]}</span></span>
              <input type="range" min={1} max={10} step={1} value={s[it.key]} className="my-2 w-full accent-irc"
                onChange={(e) => { setS({ ...s, [it.key]: Number(e.target.value) }); setA(null); setSaved(false); savingAndRouting.current = false; }} />
              <span className="flex justify-between text-xs text-slate-600"><span>1: {it.low}</span><span>10: {it.high}</span></span>
            </label>
          </Card>
        ))}
      </div>
      <div className="mt-5 text-center"><Btn primary onClick={() => { setA(buildIrcAssessment(s, getUserId())); savingAndRouting.current = false; }}>Calcular mi IRC</Btn></div>
      {a && (
        <Card className="mt-6" >
          <GaugeSemi value={a.results.irc_score} min={1} max={10} leftLabel="Superación de la servidumbre" rightLabel="Hacia la libertad" />
          <div className="mt-4 rounded-xl border-l-8 bg-white p-4" style={{ borderColor: a.results.color_code }}>
            <p className="text-lg font-bold" style={{ color: a.results.color_code }}>{a.results.state}</p>
            <p className="mt-1 text-sm">{classifyIrc(a.results.irc_score).message}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn primary onClick={saveAndGoToPag}>Guardar y calcular mi PAG</Btn>
            <Btn onClick={() => descargarPdfIrc(a)}>Descargar PDF</Btn>
            <Link href="/pag" className="rounded-full border border-boton px-5 py-2 text-sm font-bold text-boton print:hidden">Calcular mi PAG</Link>
          </div>
        </Card>
      )}
    </Page>
  );
}