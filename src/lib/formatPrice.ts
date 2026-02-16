export const formatEUR = (v: number | null | undefined): string =>
  v != null ? `€${Number(v).toLocaleString("it-IT")}` : "—";

export const formatEURCompact = (v: number): string =>
  v.toLocaleString("it-IT", {
    notation: "compact",
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
    minimumSignificantDigits: 3,
  });
