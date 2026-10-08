import type { Metadata } from "next";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spinozómetro",
  description: "Herramienta reflexiva inspirada en la Ética de Spinoza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}