import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDecimal,
  formatEur,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type { DeliveryStatus, MetricSet } from "@/lib/dashboard/types";

export interface ObjectRow {
  id: string;
  name: string;
  status: DeliveryStatus;
  /** Name of the parent object, shown for ad sets and ads. */
  parentName?: string;
  budgetEur?: number;
  /** Objective for campaigns, optimization goal for ad sets. */
  goal?: string;
  metrics: MetricSet;
}

export interface ObjectsTableProps {
  title: string;
  description: string;
  /** Column header for `parentName`, when rows carry one. */
  parentLabel?: string;
  rows: ObjectRow[];
}

export function ObjectsTable({
  title,
  description,
  parentLabel,
  rows,
}: ObjectsTableProps) {
  const showParent = Boolean(parentLabel);
  const showBudget = rows.some((row) => row.budgetEur !== undefined);
  const showGoal = rows.some((row) => row.goal !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {showParent ? <TableHead>{parentLabel}</TableHead> : null}
              <TableHead>Estado</TableHead>
              {showGoal ? <TableHead>Objetivo</TableHead> : null}
              {showBudget ? (
                <TableHead className="text-right">Orçamento/dia</TableHead>
              ) : null}
              <TableHead className="text-right">Gasto</TableHead>
              <TableHead className="text-right">Impressões</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">Resultados</TableHead>
              <TableHead className="text-right">Custo/resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.name}
                  <span className="text-muted-foreground block font-mono text-xs">
                    {row.id}
                  </span>
                </TableCell>
                {showParent ? (
                  <TableCell className="text-muted-foreground">
                    {row.parentName ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                {showGoal ? (
                  <TableCell className="font-mono text-xs">
                    {row.goal ?? "—"}
                  </TableCell>
                ) : null}
                {showBudget ? (
                  <TableCell className="text-right tabular-nums">
                    {row.budgetEur === undefined
                      ? "—"
                      : formatEur(row.budgetEur)}
                  </TableCell>
                ) : null}
                <TableCell className="text-right tabular-nums">
                  {formatEur(row.metrics.spendEur)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.metrics.impressions)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.metrics.ctr)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(row.metrics.cpcEur)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.metrics.results)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.metrics.results > 0
                    ? formatEur(row.metrics.costPerResultEur)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-muted-foreground mt-3 text-xs">
          Frequência média:{" "}
          {formatDecimal(
            rows.length > 0
              ? rows.reduce((total, row) => total + row.metrics.frequency, 0) /
                  rows.length
              : 0,
          )}
        </p>
      </CardContent>
    </Card>
  );
}
