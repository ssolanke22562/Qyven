import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentX (InsightScout) — Autonomous Competitor Intelligence Agent",
  description: "3D interactive showcase for AgentX: an autonomous competitor intelligence & research agent with persistent self-organizing knowledge graphs, Groq LPU inference, and Graph RAG.",
  keywords: ["AI Agent", "Competitor Intelligence", "Knowledge Graph", "Three.js", "React Three Fiber", "Groq", "InsightScout", "AgentX"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-slate-950 antialiased scanline">
        {children}
      </body>
    </html>
  );
}
