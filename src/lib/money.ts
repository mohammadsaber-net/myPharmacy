export function formatEGP(value: string | number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function discountedPrice(price: string | number, discount: string | number) {
  return Number((Number(price) * (1 - Number(discount) / 100)).toFixed(2));
}
