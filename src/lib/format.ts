export const formatCurrency = (value: number): string => {
  return '$' + value.toLocaleString('es-CO', { maximumFractionDigits: 0 }).replace(/,/g, '.');
};

export const formatCurrencyRaw = (value: number): string => {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 0 }).replace(/,/g, '.');
};
