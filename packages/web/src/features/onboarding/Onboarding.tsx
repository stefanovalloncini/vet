import { useAuthState } from "../auth";
import { openQuickEntry } from "../quick-entry";
import { OnboardingDialog } from "./OnboardingDialog";
import { useOnboardingState } from "./useOnboardingState";

export function Onboarding() {
  const { user } = useAuthState();
  const { open, dismiss } = useOnboardingState();

  if (!user?.caps.has("activities.create")) return null;

  return (
    <OnboardingDialog
      open={open}
      onClose={dismiss}
      onStartFirstEntry={openQuickEntry}
    />
  );
}
