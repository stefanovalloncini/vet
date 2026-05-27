import { Text, View } from "@react-pdf/renderer";
import { formatDate } from "../../../shared/lib/format";
import { styles } from "../styles";

interface AziendaHeaderProps {
  title: string;
  subtitle?: string;
  azienda: {
    nome: string;
    indirizzo?: string;
    piva?: string;
    emailFatturazione?: string;
    telefono?: string;
  };
  periodo: { from: Date | null; to: Date | null };
  emessoIl: Date;
  rightMeta?: ReadonlyArray<{ label: string; value: string }>;
}

export function AziendaHeader({
  title,
  subtitle,
  azienda,
  periodo,
  emessoIl,
  rightMeta,
}: AziendaHeaderProps) {
  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerRightLabel}>Emesso il</Text>
          <Text style={styles.headerRightValue}>{formatDate(emessoIl)}</Text>
        </View>
      </View>

      <View style={styles.bandRow}>
        <View style={styles.bandCol}>
          <Text style={styles.bandLabel}>Cliente</Text>
          <Text style={styles.bandValuePrimary}>{azienda.nome}</Text>
          {azienda.indirizzo ? (
            <Text style={styles.bandValueMuted}>{azienda.indirizzo}</Text>
          ) : null}
          {azienda.piva ? (
            <Text style={styles.bandValueMuted}>P.IVA: {azienda.piva}</Text>
          ) : null}
          {azienda.emailFatturazione ? (
            <Text style={styles.bandValueMuted}>{azienda.emailFatturazione}</Text>
          ) : null}
          {azienda.telefono ? (
            <Text style={styles.bandValueMuted}>Tel: {azienda.telefono}</Text>
          ) : null}
        </View>
        <View style={styles.bandColRight}>
          <Text style={styles.bandLabel}>Periodo</Text>
          <Text style={styles.bandValuePrimary}>
            {periodo.from ? formatDate(periodo.from) : "—"}
            {"  →  "}
            {periodo.to ? formatDate(periodo.to) : "—"}
          </Text>
          {rightMeta?.map((m) => (
            <View key={m.label} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
