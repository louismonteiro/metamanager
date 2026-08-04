import type { Metadata } from "next";

import {
  LeadsPanel,
  ConversionsPanel,
} from "@/components/dashboard/leads-panel";
import {
  ObjectsTable,
  type ObjectRow,
} from "@/components/dashboard/objects-table";
import { SpendBreakdown } from "@/components/dashboard/spend-breakdown";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { loadDashboardSnapshot } from "@/lib/dashboard/mock-data";
import type { CampaignNode } from "@/lib/dashboard/types";
import { formatDateTime, formatEur, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Monitorização somente leitura: campanhas, ad sets, anúncios, gasto em euros, leads e conversões.",
};

function campaignRows(campaigns: CampaignNode[]): ObjectRow[] {
  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    goal: campaign.objective,
    budgetEur: campaign.dailyBudgetEur,
    metrics: campaign.metrics,
  }));
}

function adSetRows(campaigns: CampaignNode[]): ObjectRow[] {
  return campaigns.flatMap((campaign) =>
    campaign.adSets.map((adSet) => ({
      id: adSet.id,
      name: adSet.name,
      status: adSet.status,
      parentName: campaign.name,
      goal: adSet.optimizationGoal,
      budgetEur: adSet.dailyBudgetEur,
      metrics: adSet.metrics,
    })),
  );
}

function adRows(campaigns: CampaignNode[]): ObjectRow[] {
  return campaigns.flatMap((campaign) =>
    campaign.adSets.flatMap((adSet) =>
      adSet.ads.map((ad) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        parentName: adSet.name,
        metrics: ad.metrics,
      })),
    ),
  );
}

export default async function DashboardPage() {
  const snapshot = await loadDashboardSnapshot();
  const { account, campaigns, leadSources, conversions } = snapshot;

  const totalLeads = leadSources.reduce((sum, row) => sum + row.leads, 0);
  const totalConversions = conversions.reduce((sum, row) => sum + row.count, 0);
  const conversionValue = conversions.reduce(
    (sum, row) => sum + row.valueEur,
    0,
  );
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "ACTIVE",
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard de monitorização
          </h1>
          <p className="text-muted-foreground text-sm">
            {account.name} · <span className="font-mono">{account.id}</span> ·{" "}
            {account.periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Somente leitura</Badge>
          <Badge variant="outline">{account.currency}</Badge>
          {snapshot.isMock ? (
            <Badge variant="warning">
              Dados de exemplo · {formatDateTime(snapshot.generatedAt)}
            </Badge>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="overview" className="flex flex-col gap-3">
        <h2 id="overview" className="text-lg font-medium">
          Visão geral da conta
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Gasto no período"
            value={formatEur(account.spendEur)}
            hint={
              account.spendCapEur
                ? `Teto de ${formatEur(account.spendCapEur)}`
                : "Sem teto definido"
            }
          />
          <StatCard
            label="Saldo"
            value={formatEur(account.balanceEur)}
            hint={`Estado da conta: ${account.accountStatus}`}
          />
          <StatCard
            label="Leads"
            value={formatNumber(totalLeads)}
            hint={`${leadSources.length} formulário(s) ativos`}
          />
          <StatCard
            label="Conversões"
            value={formatNumber(totalConversions)}
            hint={`Valor atribuído: ${formatEur(conversionValue)}`}
          />
        </div>
      </section>

      <section aria-labelledby="structure" className="flex flex-col gap-4">
        <h2 id="structure" className="text-lg font-medium">
          Estrutura ({activeCampaigns} de {campaigns.length} campanhas ativas)
        </h2>
        <ObjectsTable
          title="Campanhas"
          description="Nível de topo: objetivo, orçamento e desempenho agregado."
          rows={campaignRows(campaigns)}
        />
        <ObjectsTable
          title="Ad sets"
          description="Segmentação e orçamento por conjunto de anúncios."
          parentLabel="Campanha"
          rows={adSetRows(campaigns)}
        />
        <ObjectsTable
          title="Anúncios"
          description="Desempenho ao nível do criativo."
          parentLabel="Ad set"
          rows={adRows(campaigns)}
        />
      </section>

      <section aria-labelledby="spend" className="flex flex-col gap-4">
        <h2 id="spend" className="text-lg font-medium">
          Gasto
        </h2>
        <SpendBreakdown campaigns={campaigns} />
      </section>

      <section aria-labelledby="results" className="flex flex-col gap-4">
        <h2 id="results" className="text-lg font-medium">
          Leads e conversões
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <LeadsPanel rows={leadSources} />
          <ConversionsPanel rows={conversions} />
        </div>
      </section>

      <p className="text-muted-foreground text-xs">
        Este dashboard não tem ações de escrita. Para agir sobre qualquer
        objeto, usa o chat com o agente.
      </p>
    </div>
  );
}
