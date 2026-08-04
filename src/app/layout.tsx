import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MetaManager",
    template: "%s · MetaManager",
  },
  description:
    "Plataforma AI-agent-first de gestão de Meta Ads: um agente conversacional para agir e um dashboard de monitorização para acompanhar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
