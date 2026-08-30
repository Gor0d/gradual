import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  pendente: "bg-muted text-muted-foreground",
  em_andamento: "bg-accent/15 text-accent",
  concluida: "bg-primary/15 text-primary",
  cancelada: "bg-muted text-muted-foreground line-through",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_CLASS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
