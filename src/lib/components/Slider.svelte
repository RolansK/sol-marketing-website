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

	const transitionParams = { duration: 300, easing: (t) => t };

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

<div
	bind:this={containerRef}
	style="overflow: hidden; position: relative; height: 300px; width: 50%"
>
	{#each demoItems as _, i}
		<div
			style:position="absolute"
			style:background-color="#fff"
			style:padding="8px"
			style:border-radius="6px"
			style:box-shadow="0px 0px 1px rgba(0, 0, 0, 0.05), 0px 8px 16px rgba(0, 0, 0, 0.1)"
			style:left={getPosition(i).left}
			style:top={getPosition(i).top}
			style:transform={getPosition(i).transform}
			style:transition="all {transitionParams.duration}ms"
		>
			<div style="width: {itemWidth}px; height: 150px; background-color: red;"></div>
		</div>
	{/each}

	<div
		style="position: absolute; 
               top: 50%; 
               left: 50%; 
               transform: translate(-50%, {Math.min(maxWidth, containerWidth - padding * 2) / 2 +
			32}px); 
               display: flex; 
               gap: 16px;"
	>
		{#each demoItems as _, i}
			<div
				onpointerenter={() => (active = i)}
				style="width: 40px; 
                       height: 40px; 
                       border-radius: 50%; 
                       background: {active === i
					? `linear-gradient(to bottom, ${color1}, ${color2})`
					: 'linear-gradient(to bottom, #fff, #fff)'};
                       cursor: pointer; 
                       display: flex; 
                       padding-bottom: 1px; 
                       align-items: center; 
                       justify-content: center; 
                       color: {active === i ? '#fff' : '#000'}; 
                       font-size: 18px; 
                       transition: all {transitionParams.duration}ms;"
			>
				{i + 1}
			</div>
		{/each}
	</div>
</div>
