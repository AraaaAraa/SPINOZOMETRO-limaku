import { DISCLAIMER } from "@/lib/utils";

export const inp = "w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm";
export const fmt = (n: number) => n.toFixed(2).replace(".", ",");

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-sky-200 bg-white/70 p-5 shadow-sm ${className}`}>{children}</div>
);

export const Btn = ({ primary, className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) => (
  <button
    {...p}
    className={`cursor-pointer rounded-full px-5 py-2 text-sm font-bold transition duration-150 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 print:hidden ${
      primary
        ? "bg-boton text-white enabled:hover:bg-titulo enabled:hover:shadow-md"
        : "border border-boton text-boton enabled:hover:bg-boton enabled:hover:text-white"
    } ${className}`}
  />
);

export const Disclaimer = () => <p className="mt-8 text-center text-xs text-slate-500">{DISCLAIMER}</p>;

export const Page = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
  <main className="mx-auto max-w-3xl px-4 py-8">
    <h1 className="text-center text-3xl font-bold">{title}</h1>
    <p className="mb-6 mt-2 text-center text-sm text-slate-600">{sub}</p>
    {children}
    <Disclaimer />
  </main>
);