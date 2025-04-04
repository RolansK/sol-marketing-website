<script>
	import { onMount, onDestroy } from 'svelte';
	import GPerlin from './webgl/GPerlin.svelte';
	import GPerlinWave from './webgl/GPerlinWave.svelte';
	import GRadial from './webgl/GRadial.svelte';

	let active = $state(0);
	let containerWidth = $state(0);
	let containerRef;
	let breakpoint = $state('desktop');

	const props = $props();

	let itemWidth = $state(240);
	let gap = $state(0.25);
	let padding = $state(104);
	let maxWidth = $state(448);

	const demoItems = [1, 2, 3];

	const gradientConfig = {
		perlin: {
			colors: [
				{ color: '#C6BBFC', position: 0.25 },
				{ color: '#965EF3', position: 0.4 },
				{ color: '#5A03A0', position: 0.6 },
				{ color: '#300646', position: 0.75 }
			],
			dpi: 2,
			grainScale: 10,
			grainSpeed: 25,
			pixelScale: 22
		},
		perlinWave: {
			colors: [
				{ color: '#fae6e6', position: 0 },
				{ color: '#e03100', position: 0.35 },
				{ color: '#6e008a', position: 0.87 },
				{ color: '#0e0014', position: 1 }
			],
			dpi: 2,
			waveType: 0,
			waveScale: 40,
			pixelScale: 1
		},
		radial: {
			colors: [
				{ color: '#F9A8CF', position: 0 },
				{ color: '#965EF3', position: 0.5 },
				{ color: '#300646', position: 1 }
			],
			dpi: 2,
			waveSpeed: 2,
			pixelScale: 1
		}
	};

	function updateBreakpoint() {
		if (window.innerWidth > 1055) {
			breakpoint = 'desktop';
			itemWidth = 240;
			gap = 0.25;
			padding = 104;
			maxWidth = 448;
		} else if (window.innerWidth >= 720) {
			breakpoint = 'tablet';
			itemWidth = 200;
			gap = 0.25;
			padding = 56;
			maxWidth = 320;
		} else {
			breakpoint = 'mobile';
			itemWidth = 200;
			gap = 0.25;
			padding = 32;
			maxWidth = 280;
		}
	}

	onMount(() => {
		const measure = () => {
			if (!containerRef) return;
			containerWidth = containerRef.offsetWidth;
			updateBreakpoint();
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(containerRef);
		window.addEventListener('resize', updateBreakpoint);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', updateBreakpoint);
		};
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
			transform: `translate(${translateX}px, -50%) scale(${scale})`
		};
	}

	function getControlsPosition() {
		const activeWidth = Math.min(maxWidth, containerWidth - padding * 2);
		const scale = activeWidth / itemWidth;
		const translateY = (itemWidth * scale) / 2 + 32;

		return {
			transform: `translate(-50%, ${translateY}px)`
		};
	}
</script>

<div bind:this={containerRef} class="slider-container">
	{#each demoItems as _, i}
		<div
			class="slider-item"
			style:left={getPosition(i).left}
			style:transform={getPosition(i).transform}
		>
			{#if i === 0}
				<GPerlin {...gradientConfig.perlin} width={`${itemWidth}px`} height={`${itemWidth}px`} />
			{:else if i === 1}
				<GPerlinWave
					{...gradientConfig.perlinWave}
					width={`${itemWidth}px`}
					height={`${itemWidth}px`}
				/>
			{:else if i === 2}
				<GRadial {...gradientConfig.radial} width={`${itemWidth}px`} height={`${itemWidth}px`} />
			{/if}
		</div>
	{/each}

	<div class="controls" style:transform={getControlsPosition().transform}>
		{#each demoItems as _, i}
			<button onpointerenter={() => (active = i)} class={active === i ? 'active' : ''}>
				{i + 1}
			</button>
		{/each}
	</div>
</div>
