import { useState, type ReactNode } from "react";
import { Sparkles, PlusCircle } from "lucide-react";
import { Button, Dialog } from "../../shared/ui";

type Step = 1 | 2;

const TITLE_ID = "onboarding-title";
const TOTAL_STEPS = 2;

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onStartFirstEntry: () => void;
}

export function OnboardingDialog({
  open,
  onClose,
  onStartFirstEntry,
}: OnboardingDialogProps) {
  const [step, setStep] = useState<Step>(1);

  function handleStart() {
    onClose();
    onStartFirstEntry();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={TITLE_ID}
      size="sm"
    >
      <div className="p-6 sm:p-7 space-y-6">
        <StepIndicator current={step} />

        {step === 1 ? (
          <StepBody
            icon={<Sparkles size={18} strokeWidth={1.75} />}
            title="Pronto a iniziare"
          >
            Da qui registri le visite, vedi i riepiloghi e esporti i conti.
            Sempre offline, sempre in italiano.
          </StepBody>
        ) : (
          <StepBody
            icon={<PlusCircle size={18} strokeWidth={1.75} />}
            title="Aggiungi la tua prima attività"
          >
            Il pulsante rotondo in basso a destra apre la voce rapida. Servono
            pochi tap: data, azienda, tipo, ore.
          </StepBody>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-(--color-text-muted) hover:text-(--color-text) focus:outline-none focus-visible:underline underline-offset-4"
          >
            Salta
          </button>
          {step === 1 ? (
            <Button type="button" variant="primary" onClick={() => setStep(2)}>
              Avanti
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleStart}>
              Inizia
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={current}
      aria-label={`Passo ${current} di ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`h-1 flex-1 rounded-full transition-colors ${
            n <= current
              ? "bg-(--color-accent)"
              : "bg-(--color-surface-muted)"
          }`}
        />
      ))}
    </div>
  );
}

interface StepBodyProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

function StepBody({ icon, title, children }: StepBodyProps) {
  return (
    <div className="space-y-3">
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h2 id={TITLE_ID} className="text-xl font-medium text-(--color-text)">
        {title}
      </h2>
      <p className="text-sm text-(--color-text-muted)">{children}</p>
    </div>
  );
}

