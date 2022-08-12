export default class EventBus<T> {
	private nextId: number = 0;
	private readonly listeners: Map<number, (value: T) => void> = new Map();

	constructor() {}

	send(value: T) {
		this.listeners.forEach((l) => l(value));
	}

	on(listener: (value: T) => void): number {
		const id = this.nextId++;
		this.listeners.set(id, listener);
		return id;
	}

	remove(id: number): void {
		if (!this.listeners.delete(id)) {
			console.error(`could not remove listener: listener ${id} does not exist`);
		}
	}
}
