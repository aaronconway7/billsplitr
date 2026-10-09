// p: people, i: items (n name, a amount, s indexes of people sharing it), sc: service, pd: payer index or -1, c: currency code,
// sm: 1 when sc is a fixed amount rather than a % (left out otherwise, so older bills encode as before)
export type Item = { n: string; a: number; s: number[] };
export type Bill = { p: string[]; i: Item[]; sc: number; pd: number; c: string; sm?: 1 };

export const emptyBill = (c = 'GBP'): Bill => ({ p: [], i: [], sc: 0, pd: -1, c });
