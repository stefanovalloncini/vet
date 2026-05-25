import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AppShell, Card, PageHeader } from "../../../shared/ui";
import { strumentiI18n as t } from "../i18n";

const TOOLS = [
  {
    to: "/strumenti/dosaggio",
    title: t.dosaggioTitle,
    hint: t.dosaggioSubtitle,
  },
];

export function StrumentiHome() {
  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background)"
          >
            <Card className="h-full hover:border-(--color-border-strong) transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-(--color-text)">
                    {tool.title}
                  </h2>
                  <p className="text-sm text-(--color-text-muted) mt-1">
                    {tool.hint}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-(--color-text-subtle) group-hover:text-(--color-text-muted) flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
