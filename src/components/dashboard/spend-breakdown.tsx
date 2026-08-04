import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEur, formatPercent } from "@/lib/format";
import type { CampaignNode } from "@/lib/dashboard/types";

export function SpendBreakdown({ campaigns }: { campaigns: CampaignNode[] }) {
  const total = campaigns.reduce(
    (sum, campaign) => sum + campaign.metrics.spendEur,
    0,
  );

  const rows = [...campaigns]
    .sort((a, b) => b.metrics.spendEur - a.metrics.spendEur)
    .map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      spendEur: campaign.metrics.spendEur,
      sharePct: total > 0 ? (campaign.metrics.spendEur / total) * 100 : 0,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gasto por campanha</CardTitle>
        <CardDescription>
          Distribuição do investimento no período, em euros.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{row.name}</span>
              <span className="tabular-nums">
                {formatEur(row.spendEur)}
                <span className="text-muted-foreground ml-2 text-xs">
                  {formatPercent(row.sharePct)}
                </span>
              </span>
            </div>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="img"
              aria-label={`${row.name}: ${formatPercent(row.sharePct)} do gasto total`}
            >
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(row.sharePct, 100)}%` }}
              />
            </div>
          </div>
        ))}

        <p className="text-muted-foreground border-t pt-3 text-sm">
          Total: <span className="tabular-nums">{formatEur(total)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
