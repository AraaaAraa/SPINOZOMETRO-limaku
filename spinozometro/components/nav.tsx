"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/iev", t: "Energía Vital", on: "bg-iev text-white", off: "border-iev text-iev" },
  { href: "/", t: "Entorno (Spinozómetro)", on: "bg-ier text-white", off: "border-ier text-ier" },
  { href: "/irc", t: "Razón", on: "bg-irc text-white", off: "border-irc text-irc" },
  { href: "/pag", t: "PAG", on: "bg-pag text-white", off: "border-pag text-pag" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-wrap justify-center gap-2 px-4 pt-4 print:hidden">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={path === l.href ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm font-bold ${path === l.href ? l.on : l.off}`}
        >
          {l.t}
        </Link>
      ))}
    </nav>
  );
}