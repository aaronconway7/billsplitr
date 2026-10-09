// When the results panel is taller than the window, pin its bottom instead of its top so Share stays reachable
export function stickySide(el: HTMLElement) {
	const st = () => el.style.setProperty('--st', Math.min(20, innerHeight - el.offsetHeight - 20) + 'px');
	const ro = new ResizeObserver(st);
	ro.observe(el);
	addEventListener('resize', st);
	st();
	return () => {
		ro.disconnect();
		removeEventListener('resize', st);
	};
}
