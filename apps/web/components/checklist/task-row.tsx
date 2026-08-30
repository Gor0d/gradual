import { AddToCalendar } from "@/components/checklist/add-to-calendar";
import { TaskStatusBadge } from "@/components/checklist/task-status-badge";
import { cn } from "@/lib/utils";

type TaskRowProps = {
  task: { id: string; title: string; description: string | null; due_date: string | null; status: string };
  dueDateLabel: string | null;
};

export function TaskRow({ task, dueDateLabel }: TaskRowProps) {
  const canExportToCalendar = task.status !== "cancelada" && Boolean(task.due_date);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            task.status === "cancelada" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
        ) : null}
      </div>
      {dueDateLabel ? <span className="shrink-0 text-xs text-muted-foreground">{dueDateLabel}</span> : null}
      <TaskStatusBadge status={task.status} />
      {canExportToCalendar && task.due_date ? (
        <AddToCalendar id={task.id} event={{ title: task.title, description: task.description, date: task.due_date }} />
      ) : null}
    </div>
  );
}
