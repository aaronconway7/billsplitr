// p: people, i: items (n name, a amount, s indexes of people sharing it), sc: service %, pd: payer index or -1, c: currency code
export type Item = { n: string; a: number; s: number[] };
export type Bill = { p: string[]; i: Item[]; sc: number; pd: number; c: string };

export const emptyBill = (c = 'GBP'): Bill => ({ p: [], i: [], sc: 0, pd: -1, c });
