import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { T } from "../../theme/tokens";

export default function StatusBanner({ variant = "info", title, message, action }) {
  const styles = {
    info: {
      bg: T.tealSoft,
      color: T.teal,
      icon: Loader2,
    },
    success: {
      bg: T.tealSoft,
      color: T.teal,
      icon: CheckCircle2,
    },
    error: {
      bg: T.brickSoft,
      color: T.brick,
      icon: AlertCircle,
    },
  };

  const style = styles[variant] || styles.info;
  const Icon = style.icon;

  return (
    <div
      className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
      style={{ backgroundColor: style.bg, color: style.color, borderColor: style.color + "22" }}
    >
      <Icon size={16} className={variant === "info" ? "animate-spin mt-0.5" : "mt-0.5 shrink-0"} />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {message && <div className="text-xs opacity-90 mt-0.5">{message}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
