<script>
	import { onMount } from 'svelte';
	import Blob from '$lib/components/svg/Blob.svelte';
	import Squircle from '$lib/components/svg/Squircle.svelte';
	import Polygon from '$lib/components/svg/Polygon.svelte';
	import Super from '$lib/components/svg/Super.svelte';

	let forceGraphContainer;
	let nodes = $state([]);
	let containerRect = $state({ w: 0, h: 0 });

	const shapes = [
		{ type: 'squircle', x: 25, y: 30 },
		{ type: 'super', x: 75, y: 25, ratio: 1.5, m: 8 },
		{ type: 'super', x: 60, y: 70, ratio: 1.8, m: 12 },
		{ type: 'super', x: 35, y: 65, ratio: 2.2, m: 15 },
		{ type: 'super', x: 15, y: 80, ratio: 1.3, m: 7 },
		{ type: 'super', x: 85, y: 45, ratio: 1.7, m: 10 },
		{ type: 'super', x: 45, y: 15, ratio: 2.0, m: 20 },
		{ type: 'polygon', x: 80, y: 85, cornerCount: 5, bend: 0.3 },
		{ type: 'polygon', x: 25, y: 50, cornerCount: 3, bend: 0.2 },
		{ type: 'polygon', x: 65, y: 30, cornerCount: 6, bend: 0.1 },
		{ type: 'blob', x: 40, y: 85 },
		{ type: 'blob', x: 15, y: 15 }
	];

	const createShape = (config, i) => ({
		id: i,
		r: 45 + Math.random() * 10,
		xPercent: config.x,
		yPercent: config.y,
		originalX: config.x,
		originalY: config.y,
		shapeType: config.type,
		fillColor: i % 2 ? 'var(--pink-9)' : 'var(--orange-9)',
		strokeColor: i % 2 ? 'var(--pink-6)' : 'var(--orange-6)',
		strokeWidth: 1,
		...config
	});

	const dragAction = (element, node) => {
		let isDragging, animationId;
		const startPos = { x: 0, y: 0 },
			velocity = { x: 0, y: 0 };

		const updatePosition = (x, y) => {
			const bound = (val, max) => Math.max(node.r, Math.min(max - node.r, val));
			[node.xPercent, node.yPercent] = [
				(bound(x, containerRect.w) / containerRect.w) * 100,
				(bound(y, containerRect.h) / containerRect.h) * 100
			];
			nodes = [...nodes];
		};

		const handleMove = (e) => {
			if (!isDragging) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			const [x, y] = [e.clientX - rect.left - startPos.x, e.clientY - rect.top - startPos.y];
			updatePosition(x, y);
		};

		const handleDown = (e) => {
			e.preventDefault();
			isDragging = true;
			element.style.cursor = 'grabbing';
			const rect = forceGraphContainer.getBoundingClientRect();
			startPos.x = e.clientX - rect.left - (node.xPercent / 100) * containerRect.w;
			startPos.y = e.clientY - rect.top - (node.yPercent / 100) * containerRect.h;

			document.addEventListener('pointermove', handleMove);
			document.addEventListener(
				'pointerup',
				() => {
					isDragging = false;
					element.style.cursor = 'grab';
					document.removeEventListener('pointermove', handleMove);

					let [currentX, currentY] = [node.xPercent, node.yPercent];
					let [velX, velY] = [0, 0];

					const animate = () => {
						const dx = node.originalX - currentX;
						const dy = node.originalY - currentY;

						velX += dx * 0.05;
						velY += dy * 0.05;
						velX *= 0.85;
						velY *= 0.85;

						currentX += velX;
						currentY += velY;
						[node.xPercent, node.yPercent] = [currentX, currentY];
						nodes = [...nodes];

						if (
							Math.abs(dx) > 0.01 ||
							Math.abs(dy) > 0.01 ||
							Math.abs(velX) > 0.01 ||
							Math.abs(velY) > 0.01
						) {
							animationId = requestAnimationFrame(animate);
						}
					};
					animationId = requestAnimationFrame(animate);
				},
				{ once: true }
			);
		};

		element.addEventListener('pointerdown', handleDown);
		return { destroy: () => element.removeEventListener('pointerdown', handleDown) };
	};

	onMount(() => {
		const updateSize = () => {
			if (!forceGraphContainer) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			containerRect = { w: rect.width, h: rect.height };
		};

		updateSize();
		nodes = shapes.map(createShape);

		new ResizeObserver(updateSize).observe(forceGraphContainer);
	});
</script>

<section class="components">
	<span>
		<h2>Create a shape.<br />Any shape</h2>
		<p>
			Rounded rectangles are cool, but there's a bit more you can make with shape generators -
			flowers, stars, droplets, blobs, squircles… You get it, the list goes on.
		</p>
	</span>

	<div class="force-graph" bind:this={forceGraphContainer}>
		{#each nodes as node (node.id)}
			<div
				class="node-container"
				use:dragAction={node}
				style="
					position: absolute;
					width: {node.r * 2}px;
					height: {node.r * 2}px;
					left: {node.xPercent}%;
					top: {node.yPercent}%;
					transform: translate(-50%, -50%);
					cursor: grab;
					touch-action: none;
					user-select: none;
					overflow: hidden;
					padding: 2px;
				"
			>
				{#if node.shapeType === 'blob'}
					<Blob
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{:else if node.shapeType === 'squircle'}
					<Squircle
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{:else if node.shapeType === 'polygon'}
					<Polygon
						cornerCount={node.cornerCount}
						bend={node.bend}
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{:else if node.shapeType === 'super'}
					<Super
						ratio={node.ratio}
						m={node.m}
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{/if}
			</div>
		{/each}
	</div>
</section>
