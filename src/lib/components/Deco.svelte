<div class="deco" aria-hidden="true">
<svg class="r1" viewBox="0 0 200 150"><rect x="4" y="4" width="192" height="142" rx="14" fill="var(--card)" stroke="var(--border)"/><g fill="var(--border)"><rect x="40" y="4" width="8" height="26" rx="4"/><rect x="92" y="4" width="8" height="26" rx="4"/><rect x="144" y="4" width="8" height="26" rx="4"/><rect x="28" y="56" width="110" height="7" rx="3.5"/><rect x="28" y="78" width="140" height="7" rx="3.5"/><rect x="28" y="100" width="80" height="7" rx="3.5"/></g></svg>
<svg class="g2" viewBox="0 0 90 100"><path d="M10 4h70a6 6 0 0 1 6 6v78l-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7V10a6 6 0 0 1 6-6z" fill="var(--primary)"/><g fill="var(--card)" opacity=".9"><rect x="20" y="22" width="48" height="6" rx="3"/><rect x="20" y="38" width="40" height="6" rx="3"/><rect x="20" y="54" width="30" height="6" rx="3"/></g></svg>
<svg class="c1" viewBox="0 0 100 80"><circle cx="34" cy="34" r="30" fill="var(--primary)" opacity=".75"/><circle cx="64" cy="46" r="30" fill="var(--border)" opacity=".95"/></svg>
<svg class="g" viewBox="0 0 90 100"><path d="M10 4h70a6 6 0 0 1 6 6v78l-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7V10a6 6 0 0 1 6-6z" fill="var(--primary)"/><g fill="var(--card)" opacity=".9"><rect x="20" y="22" width="48" height="6" rx="3"/><rect x="20" y="38" width="40" height="6" rx="3"/><rect x="20" y="54" width="30" height="6" rx="3"/></g></svg>
<svg class="r2" viewBox="0 0 170 110"><rect x="4" y="4" width="162" height="102" rx="14" fill="var(--card)" stroke="var(--border)"/><g fill="var(--border)"><rect x="24" y="28" width="90" height="7" rx="3.5"/><rect x="24" y="50" width="122" height="7" rx="3.5"/><rect x="24" y="72" width="100" height="7" rx="3.5"/></g></svg>
<svg class="c2" viewBox="0 0 50 50"><circle cx="25" cy="25" r="23" fill="var(--sage)" opacity=".85"/></svg>
<svg class="r3" viewBox="0 0 120 90"><rect x="4" y="4" width="112" height="82" rx="14" fill="var(--card)" stroke="var(--border)"/><g fill="var(--border)"><rect x="24" y="26" width="60" height="7" rx="3.5"/><rect x="24" y="46" width="76" height="7" rx="3.5"/></g></svg>
</div>

<style>
	.deco { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; opacity: 0.3; }
	.deco svg { position: absolute; filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.06)); }
	.r1 { width: 190px; top: 56px; right: calc(50% + 550px); transform: rotate(-9deg); }
	.g2 { width: 54px; top: 47%; right: calc(50% + 650px); transform: rotate(-16deg); }
	.c1 { width: 96px; bottom: 70px; right: calc(50% + 530px); filter: none; }
	.g { width: 78px; top: 34px; left: calc(50% + 620px); transform: rotate(11deg); }
	.r2 { width: 160px; top: 36%; left: calc(50% + 530px); transform: rotate(6deg); }
	.c2 { width: 44px; bottom: 16%; left: calc(50% + 660px); filter: none; }
	.r3 { width: 110px; bottom: -24px; left: calc(50% + 560px); transform: rotate(-4deg); }
	@media (max-width: 1360px) {
		.deco { opacity: 0.18; }
		.r1 { width: 120px; top: -24px; right: auto; left: -46px; }
		.g2 { width: 40px; top: 44%; right: auto; left: -12px; }
		.c1 { width: 70px; bottom: -14px; right: auto; left: -18px; }
		.g { width: 54px; top: 140px; left: auto; right: -20px; }
		.r2 { width: 110px; top: 58%; left: auto; right: -60px; }
		.c2, .r3 { display: none; }
	}
	:global(.dark) .deco { opacity: 0.18; }
	@media print { .deco { display: none; } }
</style>
