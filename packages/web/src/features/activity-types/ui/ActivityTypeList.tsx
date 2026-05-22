import { GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";
import { Button, Card } from "../../../shared/ui";
import { ActivityTypeForm } from "./ActivityTypeForm";

interface SectionProps {
  title: string;
  items: ActivityType[];
  busyId: string | null;
  canManage: boolean;
  actionLabel: string;
  onToggle: (tipo: ActivityType) => void;
  onSaveTariffa: (tipo: ActivityType, value: string) => void;
}

export function ActivityTypeList(props: SectionProps) {
  const { title, items } = props;
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-3">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((tipo) => (
          <li key={tipo.id}>
            <Row tipo={tipo} {...props} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface RowProps extends SectionProps {
  tipo: ActivityType;
}

function Row({
  tipo,
  busyId,
  canManage,
  actionLabel,
  onToggle,
  onSaveTariffa,
}: RowProps) {
  const isGinecologia = tipo.id === GINECOLOGIA_TIPO_ID;
  const busy = busyId === tipo.id;
  return (
    <Card padded={false} className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-(--color-text)">{tipo.nome}</p>
          <p className="text-xs text-(--color-text-subtle) mt-1">
            id: <span className="font-mono">{tipo.id}</span> · ordine {tipo.ordine}
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant={tipo.attivo ? "ghost" : "secondary"}
            size="sm"
            onClick={() => onToggle(tipo)}
            disabled={busy}
          >
            {actionLabel}
          </Button>
        ) : (
          <StatusBadge attivo={tipo.attivo} />
        )}
      </div>
      {canManage && !isGinecologia ? (
        <ActivityTypeForm
          id={tipo.id}
          initial={tipo.tariffaStandard}
          busy={busy}
          onSubmit={(value) => onSaveTariffa(tipo, value)}
        />
      ) : null}
      {isGinecologia ? (
        <p className="mt-3 text-xs text-(--color-text-subtle)">
          Ginecologia: tariffa per cliente, ricordata dall&apos;ultima visita.
        </p>
      ) : null}
    </Card>
  );
}

function StatusBadge({ attivo }: { attivo: boolean }) {
  const tone = attivo
    ? "bg-(--color-accent-soft) text-(--color-text)"
    : "bg-(--color-surface-muted) text-(--color-text-muted)";
  return (
    <span className={`text-xs px-2 py-1 rounded-md ${tone}`}>
      {attivo ? "attivo" : "inattivo"}
    </span>
  );
}
