<script>
	import { onMount, onDestroy } from 'svelte';
	import GPerlin from './webgl/GPerlin.svelte';
	import GPerlinWave from './webgl/GPerlinWave.svelte';
	import GRadial from './webgl/GRadial.svelte';

	let active = $state(0);
	let containerWidth = $state(0);
	let containerRef;

	const { itemWidth = 240, gap = 0.25, padding = 104, maxWidth = 448 } = $props();

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

		const left = i * (inactiveWidth + gapSize);
		const translateX = -(active * (inactiveWidth + gapSize)) + (containerWidth - itemWidth) / 2;
		const scale = active === i ? activeWidth / itemWidth : inactiveWidth / itemWidth;

		return {
			left: `${left}px`,
			top: '50%',
			transform: `translate(${translateX}px, -50%) scale(${scale})`
		};
	}

	function getControlsPosition() {
		const activeWidth = Math.min(maxWidth, containerWidth - padding * 2);
		const scale = activeWidth / itemWidth;
		const translateY = (itemWidth * scale) / 2 + 32;

		return {
			top: '50%',
			left: '50%',
			transform: `translate(-50%, ${translateY}px)`
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

	<div
		class="slider-controls"
		style:top={getControlsPosition().top}
		style:left={getControlsPosition().left}
		style:transform={getControlsPosition().transform}
	>
		{#each demoItems as _, i}
			<button onpointerenter={() => (active = i)} class={active === i ? 'active' : ''}>
				{i + 1}
			</button>
		{/each}
	</div>
</div>
