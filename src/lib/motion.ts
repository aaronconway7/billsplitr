import { tick } from 'svelte';
import { flip } from 'svelte/animate';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import { fade, scale, slide } from 'svelte/transition';
import { app } from './editor.svelte.ts';

// Motion is skipped for reduced-motion users, while the bill loads, and briefly after hush() (a whole bill swapped at once)
let quietUntil = 0;
export const hush = () => (quietUntil = performance.now() + 100);
export const still = () => prefersReducedMotion.current || !app.ready || performance.now() < quietUntil;

const off = { duration: 0 };
const DUR = 200;
const ROLL = 300;

// When the last motion started ends, so the receipt image isn't taken mid-roll
let busyUntil = 0;
function busy<T extends { delay?: number; duration?: number }>(o: T) {
	busyUntil = Math.max(busyUntil, performance.now() + (o.delay ?? 0) + (o.duration ?? 0));
	return o;
}
export async function settled() {
	await tick();
	const left = busyUntil - performance.now();
	if (left <= 0) return;
	await new Promise((r) => setTimeout(r, left));
	// The frame that lands a roll on its value, then Svelte's update
	await new Promise(requestAnimationFrame);
	await tick();
}

// Rows that arrive together (a scanned receipt) slide in one after another
let burst = 0;
function stagger() {
	if (!burst) queueMicrotask(() => (burst = 0));
	return Math.min(burst++, 10) * 40;
}

export const rowIn = (node: Element) => (still() ? off : busy(slide(node, { duration: DUR, delay: stagger(), easing: cubicOut })));
export const rowOut = (node: Element) => (still() ? off : busy(slide(node, { duration: DUR, easing: cubicOut })));
export const reflow = (node: Element, fromTo: { from: DOMRect; to: DOMRect }) => (still() ? off : busy(flip(node, fromTo, { duration: DUR, easing: cubicOut })));
export const pop = (node: Element) => (still() ? off : busy(scale(node, { start: 0.8, duration: 150, easing: cubicOut })));
export const fadeIn = (node: Element) => (still() ? off : busy(fade(node, { duration: 150 })));
// For Tween: how long a number takes to roll to its new value
export const rollFor = () => (still() ? 0 : busy({ duration: ROLL }).duration);
