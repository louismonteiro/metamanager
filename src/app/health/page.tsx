import type { Metadata } from "next";
import {
  CircleAlert,
  CircleCheck,
  CircleSlash,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buildHealthReport } from "@/lib/health";
import type { MetaConnectionStatus } from "@/lib/health";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Health",
  description: "Estado da aplicação e da ligação à Meta Marketing API v26.0.",
};

// The Meta probe is a live network call: never prerender or cache this page.
export const dynamic = "force-dynamic";

const STATUS_PRESENTATION: Record<
  MetaConnectionStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive" | "secondary";
    icon: typeof CircleCheck;
  }
> = {
  ok: { label: "Ligado", variant: "success", icon: CircleCheck },
  degraded: { label: "Degradado", variant: "warning", icon: TriangleAlert },
  unconfigured: {
    label: "Não configurado",
    variant: "secondary",
    icon: CircleSlash,
  },
  error: { label: "Erro", variant: "destructive", icon: CircleAlert },
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default async function HealthPage() {
  const report = await buildHealthReport();
  const meta = report.meta;
  const presentation = STATUS_PRESENTATION[meta.status];
  const StatusIcon = presentation.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Estado do sistema
        </h1>
        <p className="text-muted-foreground text-sm">
          A aplicação está a servir esta página, logo está de pé. Abaixo, o
          estado real da ligação à Meta Marketing API.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aplicação</CardTitle>
            <CardDescription>Processo Next.js</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row
                label="Estado"
                value={
                  <Badge
                    variant={report.status === "ok" ? "success" : "warning"}
                  >
                    {report.status}
                  </Badge>
                }
              />
              <Row label="Serviço" value={report.service} />
              <Row label="Versão" value={report.version} />
              <Row label="Uptime" value={`${report.uptimeSeconds}s`} />
              <Row
                label="Verificado em"
                value={formatDateTime(report.checkedAt)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className="size-4" aria-hidden />
              Meta Marketing API
            </CardTitle>
            <CardDescription>{meta.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row
                label="Ligação"
                value={
                  <Badge variant={presentation.variant}>
                    {presentation.label}
                  </Badge>
                }
              />
              <Row
                label="META_ACCESS_TOKEN"
                value={meta.tokenPresent ? "presente" : "em falta"}
              />
              <Row
                label="Versão fixada"
                value={<span className="font-mono">{meta.apiVersion}</span>}
              />
              <Row
                label="Endpoint sondado"
                value={
                  <span className="font-mono text-xs">
                    {meta.edge ? `GET /${meta.edge}` : "—"}
                  </span>
                }
              />
              <Row label="Contas acessíveis" value={meta.accountCount ?? "—"} />
              <Row
                label="Utilização de rate limit"
                value={
                  meta.rateLimitUtilisationPct === null
                    ? "—"
                    : `${meta.rateLimitUtilisationPct}%`
                }
              />
              <Row
                label="Latência"
                value={meta.latencyMs === null ? "—" : `${meta.latencyMs} ms`}
              />
              {meta.errorCode !== null ? (
                <Row
                  label="Código de erro"
                  value={<span className="font-mono">{meta.errorCode}</span>}
                />
              ) : null}
            </dl>

            {meta.accountNames.length > 0 ? (
              <>
                <Separator className="my-4" />
                <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                  Contas
                </p>
                <ul className="flex flex-wrap gap-2">
                  {meta.accountNames.map((name) => (
                    <li key={name}>
                      <Badge variant="outline">{name}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {meta.status === "unconfigured" ? (
              <>
                <Separator className="my-4" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Define <code className="font-mono">META_ACCESS_TOKEN</code>{" "}
                  num ficheiro <code className="font-mono">.env.local</code>{" "}
                  (ver <code className="font-mono">.env.example</code>) e
                  recarrega esta página.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        A mesma verificação está disponível em JSON em{" "}
        <code className="font-mono">GET /api/health</code>.
      </p>
    </div>
  );
}
