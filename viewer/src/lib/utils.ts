import { quintOut } from 'svelte/easing';

export const CONTEXT = Symbol('svelte-pdf-viewer');

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

export function debounce(f: () => void, t: number): () => void {
	let timer: ReturnType<typeof setTimeout>;
	return () => {
		clearTimeout(timer);
		timer = setTimeout(f, t);
	};
}

export class Deferred<T> {
	private value: T | null = null;
	private listener: Array<(value: T) => void> = [];

	static fromPromise<T>(p: Promise<T>): Deferred<T> {
		let result = new Deferred<T>();
		p.then((v) => result.set(v));
		return result;
	}

	set(value: T) {
		this.value = value;
		let listener = this.listener;
		this.listener = [];

		listener.forEach((l) => l(value));
	}

	then(f: (value: T) => void) {
		if (this.value != null) {
			f(this.value);
		} else {
			this.listener.push(f);
		}
	}

	get(): T | null {
		return this.value;
	}

	promise(): Promise<T> {
		if (this.value != null) {
			return Promise.resolve(this.value);
		}

		return new Promise((resolve) => {
			this.listener.push(resolve);
		});
	}
}
