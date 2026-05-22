import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface BackLink {
  to: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  back?: BackLink;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {back ? (
        <Link
          to={back.to}
          className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3 inline-block"
        >
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-(--color-text)">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-(--color-text-muted) mt-1.5 text-sm">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
