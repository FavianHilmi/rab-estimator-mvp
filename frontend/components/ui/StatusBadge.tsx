import * as React from "react";
import { Check, Clock, AlertTriangle, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "draft"
  | "final"
  | "incomplete"
  | "terisi"
  | "belum_diisi"
  | "galat"
  | "readonly"
  | "operator"
  | "viewer"
  | "superadmin";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  let style = "bg-primary-subtle text-primary border-primary/20";
  let Icon = Clock;
  let text = label ?? "Draft";

  switch (status) {
    case "final":
      style = "bg-success-subtle text-success border-success/20";
      Icon = Check;
      text = label ?? "Final";
      break;
    case "incomplete":
      style = "bg-warning-subtle text-warning border-warning/20";
      Icon = AlertTriangle;
      text = label ?? "Harga belum lengkap";
      break;
    case "terisi":
      style = "bg-success-subtle text-success border-success/20";
      Icon = Check;
      text = label ?? "Terisi";
      break;
    case "belum_diisi":
      style = "bg-warning-subtle text-warning border-warning/20";
      Icon = AlertTriangle;
      text = label ?? "Belum diisi";
      break;
    case "galat":
    case "error":
      style = "bg-destructive/10 text-destructive border-destructive/20";
      Icon = AlertCircle;
      text = label ?? "Galat";
      break;
    case "readonly":
      style = "bg-muted text-muted-foreground border-border";
      Icon = Eye;
      text = label ?? "Hanya baca";
      break;
    case "superadmin":
      style = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300";
      Icon = Check;
      text = label ?? "Superadmin";
      break;
    case "operator":
      style = "bg-primary-subtle text-primary border-primary/20";
      Icon = Check;
      text = label ?? "Operator";
      break;
    case "viewer":
      style = "bg-muted text-muted-foreground border-border";
      Icon = Eye;
      text = label ?? "Viewer";
      break;
    case "draft":
    default:
      style = "bg-primary-subtle text-primary border-primary/20";
      Icon = Clock;
      text = label ?? "Draft";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-medium border",
        style,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span>{text}</span>
    </span>
  );
}
