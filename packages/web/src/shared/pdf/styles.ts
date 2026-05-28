import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#94a3b8",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  accent: "#0ea5e9",
  danger: "#dc2626",
  bg: "#ffffff",
} as const;

export const spacing = {
  pagePadding: 32,
  sectionGap: 18,
  rowPaddingY: 6,
} as const;

export const styles = StyleSheet.create({
  page: {
    padding: spacing.pagePadding,
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  },
  subtitle: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
  },
  headerRight: {
    textAlign: "right",
  },
  headerRightLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.muted,
  },
  headerRightValue: {
    fontSize: 10,
    color: colors.text,
    marginTop: 2,
  },
  // Two-column azienda / periodo band
  bandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 24,
  },
  bandCol: {
    flex: 1,
  },
  bandColRight: {
    flex: 1,
    textAlign: "right",
  },
  bandLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.muted,
    marginBottom: 4,
  },
  bandValuePrimary: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.text,
  },
  bandValueMuted: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: colors.muted,
    marginRight: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 9,
    color: colors.text,
  },
  // Table
  table: {
    width: "100%",
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderStrong,
    paddingBottom: 6,
    marginBottom: 2,
  },
  th: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
    fontWeight: 500,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingTop: spacing.rowPaddingY,
    paddingBottom: spacing.rowPaddingY,
    alignItems: "flex-start",
  },
  td: {
    fontSize: 9,
    color: colors.text,
  },
  tdMuted: {
    fontSize: 8.5,
    color: colors.muted,
  },
  tdRight: {
    fontSize: 9,
    color: colors.text,
    textAlign: "right",
  },
  // Column widths shared across header + body
  colData: { width: 88, paddingRight: 6 },
  colTipo: { flex: 2, paddingRight: 6 },
  colNote: { flex: 3, paddingRight: 6 },
  colOre: { width: 50, paddingRight: 6, textAlign: "right" },
  colTariffa: { width: 70, paddingRight: 6, textAlign: "right" },
  colTotale: { width: 80, textAlign: "right" },
  // Totals row
  totalsRow: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  totalsLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 8,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
    alignSelf: "center",
  },
  totalsValue: {
    width: 80,
    textAlign: "right",
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  // Watermark
  watermark: {
    position: "absolute",
    top: 320,
    left: 60,
    right: 60,
    opacity: 0.08,
    transform: "rotate(-25deg)",
    fontSize: 110,
    fontWeight: 600,
    color: colors.danger,
    textAlign: "center",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.subtle,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  notesBlock: {
    marginTop: 16,
    padding: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9.5,
    color: colors.text,
    lineHeight: 1.4,
  },
  emptyMessage: {
    paddingVertical: 28,
    textAlign: "center",
    fontSize: 10,
    color: colors.muted,
  },
});
