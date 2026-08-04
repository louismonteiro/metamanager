import Link from "next/link";
import { Activity, LayoutDashboard, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SURFACES = [
  {
    href: "/chat",
    icon: MessagesSquare,
    title: "Chat com o agente",
    description:
      "A única superfície de ação. Criar, duplicar, pausar e operar em massa acontece por linguagem natural, sempre com confirmação antes de escrever.",
    cta: "Abrir o chat",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    title: "Dashboard de monitorização",
    description:
      "Somente leitura. Campanhas, ad sets, anúncios, gasto em euros, leads e conversões numa única tela.",
    cta: "Ver o dashboard",
  },
  {
    href: "/health",
    icon: Activity,
    title: "Estado do sistema",
    description:
      "Confirma que a aplicação está de pé e mostra o estado da ligação à Meta Marketing API.",
    cta: "Verificar estado",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Gestão de Meta Ads conduzida por um agente
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          O MetaManager expõe duas superfícies e nada mais: um agente
          conversacional que traduz pedidos em chamadas à Meta Marketing API
          v26.0, e um dashboard de leitura onde acompanhas o resultado. Sem
          wizards, sem formulários de campanha.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SURFACES.map(({ href, icon: Icon, title, description, cta }) => (
          <Card key={href} className="justify-between">
            <CardHeader>
              <Icon className="text-muted-foreground size-5" aria-hidden />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={href}>{cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
