/** Lowercases and strips accents so "latex" also finds "látex". */
export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** `price` is already discounted; recovers the price before the offer, in cents. */
export const originalPrice = (price: number, discount: number) =>
  discount > 0 && discount < 100 ? Math.round(price / (1 - discount / 100)) : price;
