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
import { formatEur, formatNumber } from "@/lib/format";
import type { ConversionRow, LeadSourceRow } from "@/lib/dashboard/types";

export function LeadsPanel({ rows }: { rows: LeadSourceRow[] }) {
  const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por formulário</CardTitle>
        <CardDescription>
          {formatNumber(totalLeads)} leads no período, por formulário e anúncio
          de origem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formulário</TableHead>
              <TableHead>Anúncio</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Custo por lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.formId}-${row.adName}`}>
                <TableCell className="font-medium">
                  {row.formName}
                  <span className="text-muted-foreground block font-mono text-xs">
                    {row.formId}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.adName}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.leads)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatEur(row.costPerLeadEur)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ConversionsPanel({ rows }: { rows: ConversionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversões</CardTitle>
        <CardDescription>
          Eventos atribuídos no período, por tipo de ação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Eventos</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.actionType}>
                <TableCell className="font-medium">
                  {row.label}
                  <span className="text-muted-foreground block font-mono text-xs">
                    {row.actionType}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.count)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.valueEur > 0 ? formatEur(row.valueEur) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
