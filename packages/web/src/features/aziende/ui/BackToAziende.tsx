import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { aziendeI18n as t } from "../i18n";

export function BackToAziende() {
  return (
    <Link
      to="/aziende"
      className="-ml-1 inline-flex h-11 items-center gap-1.5 rounded-lg px-1 text-sm text-(--color-text-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
    >
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      <span>{t.title}</span>
    </Link>
  );
}
