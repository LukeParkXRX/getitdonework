import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#111111",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 10,
    color: "#888888",
  },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "right",
  },
  invoiceMeta: {
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: 24,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 32,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 10,
    color: "#666666",
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomColor: "#f0f0f0",
    borderBottomWidth: 1,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    borderBottomColor: "#f0f0f0",
    borderBottomWidth: 1,
  },
  colDate: { width: "35%", fontSize: 10, color: "#333333" },
  colTokens: { width: "25%", fontSize: 10, color: "#333333", textAlign: "right" },
  colGross: { width: "20%", fontSize: 10, color: "#333333", textAlign: "right" },
  colNet: { width: "20%", fontSize: 10, color: "#333333", textAlign: "right" },
  colHeaderDate: { width: "35%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#666666" },
  colHeaderTokens: { width: "25%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#666666", textAlign: "right" },
  colHeaderGross: { width: "20%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#666666", textAlign: "right" },
  colHeaderNet: { width: "20%", fontSize: 9, fontFamily: "Helvetica-Bold", color: "#666666", textAlign: "right" },
  summaryWrapper: {
    marginTop: 24,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 0,
    marginBottom: 6,
    width: 240,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 11,
    color: "#666666",
    textAlign: "left",
  },
  summaryValue: {
    fontSize: 11,
    color: "#333333",
    textAlign: "right",
    width: 80,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#dddddd",
    width: 240,
    marginVertical: 10,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "left",
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "right",
    width: 80,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    borderTopColor: "#e5e5e5",
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#aaaaaa",
  },
  statusBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#388e3c",
  },
});

export type InvoicePdfData = {
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  enablerName: string;
  enablerEmail: string;
  earnings: { date: string; tokens: number; usd: number; net: number }[];
  totalGrossUsd: number;
  totalFeeUsd: number;
  totalNetUsd: number;
  feePct: number;
  status?: string;
};

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  return (
    <Document
      title={`Invoice ${data.invoiceNumber}`}
      author="Get It Done at Work"
      subject={`Payout Invoice — ${data.enablerName}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandName}>Get It Done at Work</Text>
            <Text style={styles.brandSub}>https://getitdonework.com</Text>
            <Text style={styles.brandSub}>contact@getitdonework.com</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>
              Period: {data.periodStart} ~ {data.periodEnd}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* From / To */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoName}>Get It Done at Work</Text>
            <Text style={styles.infoText}>XRX Studio, Inc.</Text>
            <Text style={styles.infoText}>contact@getitdonework.com</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>To (Enabler)</Text>
            <Text style={styles.infoName}>{data.enablerName}</Text>
            <Text style={styles.infoText}>{data.enablerEmail}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Platform Fee</Text>
            <Text style={styles.infoName}>{data.feePct}%</Text>
            <Text style={styles.infoText}>Applied to gross earnings</Text>
          </View>
        </View>

        {/* Earnings Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colHeaderDate}>Date</Text>
          <Text style={styles.colHeaderTokens}>Credits</Text>
          <Text style={styles.colHeaderGross}>Gross (USD)</Text>
          <Text style={styles.colHeaderNet}>Net (USD)</Text>
        </View>

        {data.earnings.map((row, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colDate}>{row.date}</Text>
            <Text style={styles.colTokens}>{row.tokens.toLocaleString()}</Text>
            <Text style={styles.colGross}>${row.usd.toFixed(2)}</Text>
            <Text style={styles.colNet}>${row.net.toFixed(2)}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summaryWrapper}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${data.totalGrossUsd.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee ({data.feePct}%)</Text>
            <Text style={styles.summaryValue}>-${data.totalFeeUsd.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payout</Text>
            <Text style={styles.totalValue}>${data.totalNetUsd.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Get It Done at Work · Enabler Payout Invoice · {data.invoiceNumber}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{(data.status ?? "ISSUED").toUpperCase()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
