<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { CONTEXT } from './utils';
	import type { Context } from './types';

	const { currentPage, pages } = getContext<Context>(CONTEXT);
	const dispatch = createEventDispatcher();

	// update $currentPage if input is valid
	function onInput(e: Event) {
		let target = e.target as HTMLInputElement;
		let value = parseInt(target.value);
		if (!target.validity.valid) {
			target.value = ($currentPage + 1).toString();
		} else if (!isNaN(value)) {
			dispatch('goto', { page: value - 1, hard: true });
		}
	}

	// prevent illegal characters (everything but \d)
	function beforeInput(e: InputEvent) {
		if (e.data == null) return;
		if (!/^\d*$/.test(e.data)) {
			e.preventDefault();
		}
	}

	// reset if the input is empty on blur
	function onBlur(e: FocusEvent) {
		let target = e.target as HTMLInputElement;
		if (target.value == '' || !target.validity.valid) {
			target.value = ($currentPage + 1).toString();
		}
	}
</script>

<input
	aria-label="Current Page"
	type="number"
	class="mr-0 w-8 bg-zinc-900 rounded text-right pr-[3px]"
	inputmode="numeric"
	pattern="[0-9]*"
	min="1"
	max={$pages.length}
	value={$currentPage + 1}
	on:input={onInput}
	on:beforeinput={beforeInput}
	on:blur={onBlur}
/>

<style>
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
