// p: people, i: items (n name, a amount, s indexes of people sharing it, w optional share weights lined up with s), sc: service, pd: payer index or -1, c: currency code,
// sm: 1 when sc is a fixed amount rather than a % (left out otherwise, so older bills encode as before)
export type Item = { n: string; a: number; s: number[]; w?: number[] };
// Longest item name; keeps the share string well under the server's 8 KB cap (netlify/lib/receipt.mjs mirrors it)
export const NAME_MAX = 60;
export type Bill = { p: string[]; i: Item[]; sc: number; pd: number; c: string; sm?: 1 };

export const emptyBill = (c = 'GBP'): Bill => ({ p: [], i: [], sc: 0, pd: -1, c });

// The most shares one person can have of an uneven item
export const MAX_W = 9;
