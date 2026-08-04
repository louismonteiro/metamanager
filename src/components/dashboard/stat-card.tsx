import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
