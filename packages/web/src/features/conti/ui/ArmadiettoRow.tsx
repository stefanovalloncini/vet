import { NumberField, Switch } from "../../../shared/ui";
import { contiI18n as t } from "../i18n";
import type { ArmadiettoState } from "../hooks/useArmadietto";

export function ArmadiettoRow({ state }: { state: ArmadiettoState }) {
  return (
    <div className="mt-4 flex items-end justify-between gap-4 border-t border-(--color-border) pt-4">
      <div className="pb-2">
        <Switch
          checked={state.attivo}
          onChange={state.setAttivo}
          label={t.armadietto}
        />
      </div>
      <div className="w-40">
        <NumberField
          id="armadietto-importo"
          label={t.armadiettoImporto}
          value={state.importoStr === "" ? "" : Number(state.importoStr)}
          onChange={(v) => state.setImporto(v === "" ? "" : String(v))}
          disabled={!state.attivo}
          min={0}
          max={100000}
          step={0.01}
          suffix="€"
        />
      </div>
    </div>
  );
}
