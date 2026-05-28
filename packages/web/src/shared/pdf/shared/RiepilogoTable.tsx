import { Text, View } from "@react-pdf/renderer";
import type { Attivita } from "@vet/shared";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { styles } from "../styles";

const oreFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatOre(a: Attivita): string {
  if (!a.oraria || a.ore === undefined) return "—";
  return oreFormatter.format(a.ore);
}

function formatTariffa(a: Attivita): string {
  if (a.tariffa === 0) return "—";
  return formatEuro(a.tariffa);
}

interface RiepilogoTableProps {
  righe: ReadonlyArray<Attivita>;
  totale: number;
  armadietto?: number;
}

export function RiepilogoTable({
  righe,
  totale,
  armadietto,
}: RiepilogoTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHead} fixed>
        <Text style={[styles.th, styles.colData]}>Data</Text>
        <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
        <Text style={[styles.th, styles.colNote]}>Note</Text>
        <Text style={[styles.th, styles.colOre]}>Ore</Text>
        <Text style={[styles.th, styles.colTariffa]}>Tariffa</Text>
        <Text style={[styles.th, styles.colTotale]}>Totale</Text>
      </View>

      {righe.length === 0 ? (
        <Text style={styles.emptyMessage}>
          Nessuna prestazione nel periodo selezionato.
        </Text>
      ) : (
        righe.map((a) => (
          <View key={a.id} style={styles.tableRow} wrap={false}>
            <Text style={[styles.td, styles.colData]}>{formatDate(a.data)}</Text>
            <Text style={[styles.td, styles.colTipo]}>{a.tipoNome}</Text>
            <Text style={[styles.tdMuted, styles.colNote]}>{a.note ?? ""}</Text>
            <Text style={[styles.td, styles.colOre]}>{formatOre(a)}</Text>
            <Text style={[styles.td, styles.colTariffa]}>
              {formatTariffa(a)}
            </Text>
            <Text style={[styles.td, styles.colTotale]}>
              {formatEuro(a.totale)}
            </Text>
          </View>
        ))
      )}

      {armadietto !== undefined ? (
        <View style={styles.tableRow} wrap={false}>
          <Text style={[styles.td, styles.colData]}>—</Text>
          <Text style={[styles.td, styles.colTipo]}>Armadietto farmaci</Text>
          <Text style={[styles.tdMuted, styles.colNote]}>Canone periodo</Text>
          <Text style={[styles.td, styles.colOre]}>—</Text>
          <Text style={[styles.td, styles.colTariffa]}>—</Text>
          <Text style={[styles.td, styles.colTotale]}>
            {formatEuro(armadietto)}
          </Text>
        </View>
      ) : null}

      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>Totale</Text>
        <Text style={styles.totalsValue}>{formatEuro(totale)}</Text>
      </View>
    </View>
  );
}
