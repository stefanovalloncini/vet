import { Link } from "react-router-dom";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="block">
            <Card className="h-full hover:border-(--color-border-strong) transition-colors">
              <h2 className="text-base font-medium text-(--color-text)">
                {tool.title}
              </h2>
              <p className="text-sm text-(--color-text-muted) mt-1">
                {tool.hint}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
