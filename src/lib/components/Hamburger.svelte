<script>
	let isOpen = $state(false);

	let {
		hamburgerClick,
		unit = 'px',
		width = 32,
		height = 24,
		lineHeight = 2,
		contain = false
	} = $props();

	let offset = $derived(height / 2 - lineHeight / 2);

	function toggleMenu() {
		isOpen = !isOpen;
		if (hamburgerClick) hamburgerClick();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={toggleMenu} class="hamburger" class:isOpen>
	<div
		style:transform={isOpen ? `translate(0, ${offset}${unit}) rotate(45deg)` : ''}
		style:width={isOpen && contain
			? Math.sqrt(2 * Math.pow(width > height ? height : width, 2)) - lineHeight + unit
			: width + unit}
	></div>
	<div
		style:transform={isOpen ? `translate(0, -${offset}${unit}) rotate(-45deg)` : ''}
		style:width={isOpen && contain
			? Math.sqrt(2 * Math.pow(width > height ? height : width, 2)) - lineHeight + unit
			: width + unit}
	></div>
</div>
