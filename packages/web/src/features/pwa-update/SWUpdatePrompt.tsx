import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useToast } from "../../shared/ui/Toast";

export function SWUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (!needRefresh || shown.current) return;
    shown.current = true;
    toast.notify("Aggiornamento disponibile.", {
      kind: "info",
      persistent: true,
      action: {
        label: "Ricarica",
        onClick: () => {
          setNeedRefresh(false);
          void updateServiceWorker(true);
        },
      },
    });
  }, [needRefresh, setNeedRefresh, toast, updateServiceWorker]);

  return null;
}
