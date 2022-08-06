import { quintOut } from 'svelte/easing';

export const CONTEXT = Symbol('svelte-pdf-viewer');
export const PAGE_INDEX_ATTRIBUTE = 'data-page-index';

export const slide = (_node: HTMLElement, params: { em: number }) => ({
	delay: 0,
	duration: 200,
	easing: quintOut,
	css: (_t: number, u: number) => `margin-left: -${u * params.em}em`
});

export function getScrollRatio(element: Element, axis: 'x' | 'y' = 'y') {
	return axis == 'x'
		? element.scrollLeft / (element.scrollWidth - element.clientWidth)
		: element.scrollTop / (element.scrollHeight - element.clientHeight);
}

export function setScrollRatio(element: Element, ratio: number, axis: 'x' | 'y' = 'y') {
	axis == 'x'
		? (element.scrollLeft = ratio * (element.scrollWidth - element.clientWidth))
		: (element.scrollTop = ratio * (element.scrollHeight - element.clientHeight));
}

export function clamp(n: number, { min, max }: { min: number; max: number }): number {
	return Math.min(Math.max(n, min), max);
}

export function withoutClass(element: HTMLElement, clazz: string, callback: () => void) {
	element.classList.remove(clazz);
	callback();
	element.classList.add(clazz);
}
