export type Currency = { code: string; sym: string; flag: string; dec?: number };

export const C: Currency[] = [
	{code:'GBP',sym:'£',flag:'🇬🇧'},{code:'USD',sym:'$',flag:'🇺🇸'},{code:'EUR',sym:'€',flag:'🇪🇺'},{code:'AUD',sym:'A$',flag:'🇦🇺'},
	{code:'CAD',sym:'CA$',flag:'🇨🇦'},{code:'INR',sym:'₹',flag:'🇮🇳'},{code:'NZD',sym:'NZ$',flag:'🇳🇿'},{code:'JPY',sym:'¥',flag:'🇯🇵',dec:0},
	{code:'CNY',sym:'¥',flag:'🇨🇳'},{code:'HKD',sym:'HK$',flag:'🇭🇰'},{code:'SGD',sym:'S$',flag:'🇸🇬'},{code:'CHF',sym:'CHF',flag:'🇨🇭'},
	{code:'SEK',sym:'kr',flag:'🇸🇪'},{code:'NOK',sym:'kr',flag:'🇳🇴'},{code:'DKK',sym:'kr',flag:'🇩🇰'},{code:'ISK',sym:'kr',flag:'🇮🇸',dec:0},
	{code:'PLN',sym:'zł',flag:'🇵🇱'},{code:'CZK',sym:'Kč',flag:'🇨🇿'},{code:'HUF',sym:'Ft',flag:'🇭🇺'},{code:'RON',sym:'lei',flag:'🇷🇴'},
	{code:'BGN',sym:'лв',flag:'🇧🇬'},{code:'TRY',sym:'₺',flag:'🇹🇷'},{code:'RUB',sym:'₽',flag:'🇷🇺'},{code:'UAH',sym:'₴',flag:'🇺🇦'},
	{code:'ILS',sym:'₪',flag:'🇮🇱'},{code:'AED',sym:'د.إ',flag:'🇦🇪'},{code:'SAR',sym:'﷼',flag:'🇸🇦'},{code:'QAR',sym:'﷼',flag:'🇶🇦'},
	{code:'KWD',sym:'KD',flag:'🇰🇼',dec:3},{code:'BHD',sym:'BD',flag:'🇧🇭',dec:3},{code:'OMR',sym:'﷼',flag:'🇴🇲',dec:3},{code:'JOD',sym:'JD',flag:'🇯🇴',dec:3},
	{code:'EGP',sym:'E£',flag:'🇪🇬'},{code:'MAD',sym:'MAD',flag:'🇲🇦'},{code:'TND',sym:'DT',flag:'🇹🇳',dec:3},{code:'DZD',sym:'DA',flag:'🇩🇿'},
	{code:'ZAR',sym:'R',flag:'🇿🇦'},{code:'NGN',sym:'₦',flag:'🇳🇬'},{code:'GHS',sym:'₵',flag:'🇬🇭'},{code:'KES',sym:'KSh',flag:'🇰🇪'},
	{code:'TZS',sym:'TSh',flag:'🇹🇿'},{code:'UGX',sym:'USh',flag:'🇺🇬',dec:0},{code:'RWF',sym:'RF',flag:'🇷🇼',dec:0},{code:'ETB',sym:'Br',flag:'🇪🇹'},
	{code:'XOF',sym:'CFA',flag:'🇸🇳'},{code:'XAF',sym:'FCFA',flag:'🇨🇲'},{code:'AOA',sym:'Kz',flag:'🇦🇴'},{code:'MZN',sym:'MT',flag:'🇲🇿'},
	{code:'BWP',sym:'P',flag:'🇧🇼'},{code:'NAD',sym:'N$',flag:'🇳🇦'},{code:'ZMW',sym:'ZK',flag:'🇿🇲'},{code:'MWK',sym:'MK',flag:'🇲🇼'},
	{code:'MUR',sym:'₨',flag:'🇲🇺'},{code:'SCR',sym:'₨',flag:'🇸🇨'},{code:'PKR',sym:'₨',flag:'🇵🇰'},{code:'BDT',sym:'৳',flag:'🇧🇩'},
	{code:'LKR',sym:'Rs',flag:'🇱🇰'},{code:'NPR',sym:'₨',flag:'🇳🇵'},{code:'IDR',sym:'Rp',flag:'🇮🇩'},{code:'MYR',sym:'RM',flag:'🇲🇾'},
	{code:'THB',sym:'฿',flag:'🇹🇭'},{code:'VND',sym:'₫',flag:'🇻🇳',dec:0},{code:'PHP',sym:'₱',flag:'🇵🇭'},{code:'KRW',sym:'₩',flag:'🇰🇷',dec:0},
	{code:'TWD',sym:'NT$',flag:'🇹🇼'},{code:'MNT',sym:'₮',flag:'🇲🇳'},{code:'KZT',sym:'₸',flag:'🇰🇿'},{code:'UZS',sym:'soʻm',flag:'🇺🇿'},
	{code:'GEL',sym:'₾',flag:'🇬🇪'},{code:'AMD',sym:'֏',flag:'🇦🇲'},{code:'AZN',sym:'₼',flag:'🇦🇿'},{code:'BRL',sym:'R$',flag:'🇧🇷'},
	{code:'ARS',sym:'AR$',flag:'🇦🇷'},{code:'CLP',sym:'CL$',flag:'🇨🇱'},{code:'COP',sym:'CO$',flag:'🇨🇴'},{code:'PEN',sym:'S/',flag:'🇵🇪'},
	{code:'UYU',sym:'$U',flag:'🇺🇾'},{code:'PYG',sym:'₲',flag:'🇵🇾',dec:0},{code:'BOB',sym:'Bs',flag:'🇧🇴'},{code:'MXN',sym:'MX$',flag:'🇲🇽'},
	{code:'GTQ',sym:'Q',flag:'🇬🇹'},{code:'HNL',sym:'L',flag:'🇭🇳'},{code:'NIO',sym:'C$',flag:'🇳🇮'},{code:'CRC',sym:'₡',flag:'🇨🇷'},
	{code:'PAB',sym:'B/.',flag:'🇵🇦'},{code:'DOP',sym:'RD$',flag:'🇩🇴'},{code:'JMD',sym:'J$',flag:'🇯🇲'},{code:'TTD',sym:'TT$',flag:'🇹🇹'},
	{code:'BBD',sym:'Bds$',flag:'🇧🇧'},{code:'BSD',sym:'B$',flag:'🇧🇸'},{code:'BZD',sym:'BZ$',flag:'🇧🇿'},{code:'GYD',sym:'G$',flag:'🇬🇾'},
	{code:'SRD',sym:'SR$',flag:'🇸🇷'},{code:'XCD',sym:'EC$',flag:'🇦🇬'},{code:'ALL',sym:'L',flag:'🇦🇱'},{code:'RSD',sym:'RSD',flag:'🇷🇸'},
	{code:'MKD',sym:'ден',flag:'🇲🇰'},{code:'BAM',sym:'KM',flag:'🇧🇦'},{code:'MDL',sym:'L',flag:'🇲🇩'},{code:'BYN',sym:'Br',flag:'🇧🇾'}
];

const CM: Record<string, Currency> = Object.fromEntries(C.map((c) => [c.code, c]));

export const curOk = (v: unknown): v is string => typeof v === 'string' && Object.hasOwn(CM, v);
export const curMeta = (code: string) => CM[code] ?? C[0];
export const curDec = (c: Currency) => c.dec ?? 2;
export const curStep = (d: number) => (d === 0 ? '1' : (1 / 10 ** d).toFixed(d));
export const curLabel = (c: Currency) => `${c.flag} ${c.code} (${c.sym})`;

// Amounts are held in minor units ×100 (pence), whatever the currency's decimals
export function money(p: number, code: string) {
	const m = curMeta(code);
	return m.sym + (p / 100).toFixed(curDec(m));
}
