<script>
	import { onMount, onDestroy } from 'svelte';
	import GPerlin from './webgl/GPerlin.svelte';
	import GPerlinWave from './webgl/GPerlinWave.svelte';
	import GRadial from './webgl/GRadial.svelte';

	let active = $state(0);
	let containerWidth = $state(0);
	let containerRef;

	const {
		itemWidth = 500,
		gap = 0.25,
		padding = 0,
		maxWidth = 300,
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

		const alignmentOffset = (containerWidth - activeWidth) / 2;

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
			{#if i === 0}
				<GPerlin width={`${itemWidth}px`} height={`${itemWidth}px`} />
			{:else if i === 1}
				<GPerlinWave width={`${itemWidth}px`} height={`${itemWidth}px`} />
			{:else if i === 2}
				<GRadial width={`${itemWidth}px`} height={`${itemWidth}px`} />
			{/if}
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
