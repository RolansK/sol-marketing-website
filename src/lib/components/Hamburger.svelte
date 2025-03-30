<script>
	let {
		isOpen,
		hamburgerClick,
		unit = 'rem',
		width = 6,
		height = 4,
		lineHeight = 0.8,
		contain = false,
		lineBorderRadius = 0.4
	} = $props();

	let offset = $derived(height / 2 - lineHeight / 2);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={hamburgerClick} class:isOpen style:width={width + unit} style:height={height + unit}>
	<div
		style:height={lineHeight + unit}
		style:transform={isOpen ? `translate(0, ${offset}${unit}) rotate(45deg)` : ''}
		style:width={isOpen && contain
			? Math.sqrt(2 * Math.pow(width > height ? height : width, 2)) - lineHeight + unit
			: width + unit}
		style:border-radius={lineBorderRadius + unit}
	></div>
	<div
		class="l"
		style:height={lineHeight + unit}
		style:border-radius={lineBorderRadius + unit}
	></div>
	<div
		style:height={lineHeight + unit}
		style:transform={isOpen ? `translate(0, -${offset}${unit}) rotate(-45deg)` : ''}
		style:width={isOpen && contain
			? Math.sqrt(2 * Math.pow(width > height ? height : width, 2)) - lineHeight + unit
			: width + unit}
		style:border-radius={lineBorderRadius + unit}
	></div>
</div>

<style>
	div {
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		transition: 1s ease-in-out;
		background-color: var(--bg-hamburger);
		& div {
			margin: 0;
			width: 100%;
			transform: rotate(0deg);
			transform-origin: center;
			background-color: var(--bg-line);
		}
	}

	.isOpen div:nth-child(2) {
		opacity: 0;
	}
</style>
