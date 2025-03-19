<script>
	import { onMount, onDestroy } from 'svelte';

	let active = $state(0);
	let containerWidth = $state(0);
	let containerRef;

	const {
		itemWidth = 240,
		gap = 0.25,
		padding = 0,
		maxWidth = 500,
		color1 = '#000',
		color2 = '#000',
		components = [1, 2, 3]
	} = $props();

	const demoItems = [1, 2, 3];

	onMount(() => {
		const measure = () => {
			if (!containerRef) return;
			containerWidth = containerRef.offsetWidth;
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(containerRef);

		return () => observer.disconnect();
	});

	function getPosition(i) {
		const activeWidth = Math.min(maxWidth, containerWidth - padding * 2);
		const inactiveWidth = activeWidth * 0.8;
		const gapSize = activeWidth * gap;
		const alignmentOffset = (containerWidth - itemWidth) / 2;

		const left = i * (inactiveWidth + gapSize);
		const translateX = -(active * (inactiveWidth + gapSize)) + alignmentOffset;
		const scale = active === i ? activeWidth / itemWidth : inactiveWidth / itemWidth;

		return {
			left: `${left}px`,
			top: '50%',
			transform: `translate(${translateX}px, -50%) scale(${scale})`
		};
	}
</script>

<div bind:this={containerRef} class="slider-container">
	{#each demoItems as _, i}
		<div
			class="slider-item"
			style:left={getPosition(i).left}
			style:top={getPosition(i).top}
			style:transform={getPosition(i).transform}
		>
			<div class="slider-item-content"></div>
		</div>
	{/each}

	<div class="slider-controls">
		{#each demoItems as _, i}
			<button onpointerenter={() => (active = i)} class={active === i ? 'active' : ''}>
				{i + 1}
			</button>
		{/each}
	</div>
</div>
