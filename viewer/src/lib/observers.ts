import type { PageData } from './types';
import type { Writable } from 'svelte/store';

export class CurrentPageObserver {
	private observer: IntersectionObserver;
	private visibilities: Map<number, number>;
	private currentPageStore: Writable<number>;
	private shouldLoad: Writable<Set<number>>;

	constructor(
		wrapper: HTMLDivElement,
		currentPageStore: Writable<number>,
		shouldLoad: Writable<Set<number>>
	) {
		this.visibilities = new Map();
		this.currentPageStore = currentPageStore;
		this.shouldLoad = shouldLoad;
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => this.on(e));
				this.updated();
			},
			{
				root: wrapper,
				threshold: [0, 0.2, 0.4, 0.6, 0.8, 1]
			}
		);
	}

	observe(page: PageData) {
		this.observer.observe(page.element!);
	}

	unobserve(page: PageData) {
		this.observer.unobserve(page.element!);
	}

	destroy() {
		this.observer.disconnect();
	}

	private on(entry: IntersectionObserverEntry) {
		let index = parseInt(entry.target.getAttribute('data-page-index')!);
		if (entry.isIntersecting) {
			this.visibilities.set(index, entry.intersectionRatio);
		} else {
			this.visibilities.delete(index);
		}
	}

	private updated() {
		let current = 0;
		let currentVisibility = 0;
		this.visibilities.forEach((visibility, index) => {
			if (visibility > currentVisibility || (visibility == currentVisibility && index < current)) {
				current = index;
				currentVisibility = visibility;
			}
		});

		this.shouldLoad.update((shouldLoad) => {
			shouldLoad.clear();
			for (let index of this.visibilities.keys()) {
				shouldLoad.add(index);
			}
			return shouldLoad;
		});

		this.currentPageStore.set(current);
	}
}

export class SimpleResizeObserver {
	private observer: ResizeObserver;
	private listener: Map<Element, () => void>;

	constructor() {
		this.observer = new ResizeObserver((entries) => {
			entries.forEach((e) => this.on(e));
		});
		this.listener = new Map();
	}

	observe(element: Element, callback: () => void) {
		if (this.listener.get(element) != null) {
			console.warn('replacing existing listener for', element);
		}
		this.listener.set(element, callback);
		this.observer.observe(element);
	}

	unobserve(element: Element) {
		this.observer.unobserve(element);
		this.listener.delete(element);
	}

	destroy() {
		this.listener.clear();
		this.observer.disconnect();
	}

	private on(entry: ResizeObserverEntry) {
		this.listener.get(entry.target)?.call(null);
	}
}
