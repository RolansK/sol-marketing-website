<script>
	import { onMount } from 'svelte';
	import Blob from '$lib/components/svg/Blob.svelte';
	import Squircle from '$lib/components/svg/Squircle.svelte';
	import Polygon from '$lib/components/svg/Polygon.svelte';
	import Super from '$lib/components/svg/Super.svelte';

	let forceGraphContainer;
	let nodes = $state([]);
	let containerRect = $state({ w: 0, h: 0 });

	const shapesConfig = [
		{ type: 'super', xPercent: 68, yPercent: 18, ratio: 10, m: 60, n1: -14, n2: 5.1, n3: 38.5 },
		{ type: 'blob', xPercent: 32, yPercent: 12, pointCount: 40, strength: 2, seed: 17 },
		{ type: 'super', xPercent: 17, yPercent: 34, ratio: 1, m: 20, n1: 6, n2: -2, n3: 0.6 },
		{ type: 'super', xPercent: 81, yPercent: 38, ratio: 1, m: 6, n1: 48, n2: 22, n3: 28 },
		{ type: 'super', xPercent: 54.5, yPercent: 30.5, ratio: 25, m: 6, n1: 5, n2: 1, n3: 1.2 },
		{ type: 'super', xPercent: 30, yPercent: 45, ratio: 2.6, m: 14, n1: 1, n2: -0.1, n3: 1 },
		{ type: 'super', xPercent: 49, yPercent: 57, ratio: 1, m: 4, n1: 48, n2: 16, n3: 16 },
		{ type: 'blob', xPercent: 15, yPercent: 15, pointCount: 3, strength: 9, seed: 12 },
		{ type: 'super', xPercent: 73.5, yPercent: 53.8, ratio: 0.2, m: 16, n1: 23.1, n2: -5, n3: 4 },
		{
			type: 'super',
			xPercent: 55,
			yPercent: 70.2,
			ratio: 50,
			m: 10,
			n1: 28.2,
			n2: -30.8,
			n3: -3.8
		},
		{ type: 'super', xPercent: 82.5, yPercent: 85.5, ratio: 1, m: 6, n1: 9, n2: 50, n3: 10 },
		{ type: 'squircle', xPercent: 22.5, yPercent: 71.5, smoothing: 1 },
		{ type: 'polygon', xPercent: 45, yPercent: 90.5, cornerCount: 3, bend: 0.9 },
		{ type: 'polygon', xPercent: 25, yPercent: 50, cornerCount: 3, bend: 0.2 },
		{ type: 'polygon', xPercent: 75, yPercent: 28, cornerCount: 6, bend: 0.1 }
	];

	const dragAction = (element, node) => {
		let lastPos = { x: 0, y: 0 },
			velocity = { x: 0, y: 0 },
			animationId;
		let isDragging = false;
		const springConfig = {
			stiffness: 0.05,
			damping: 0.85,
			precision: 0.01
		};

		const updatePosition = (x, y) => {
			const boundedX = Math.max(node.r, Math.min(containerRect.w - node.r, x));
			const boundedY = Math.max(node.r, Math.min(containerRect.h - node.r, y));
			[node.xPercent, node.yPercent] = [
				(boundedX / containerRect.w) * 100,
				(boundedY / containerRect.h) * 100
			];
			nodes = [...nodes];
		};

		const handleDown = (e) => {
			e.preventDefault();
			cancelAnimationFrame(animationId);
			isDragging = true;
			element.style.cursor = 'grabbing';

			const rect = forceGraphContainer.getBoundingClientRect();
			const [mouseX, mouseY] = [e.clientX - rect.left, e.clientY - rect.top];
			const [startX, startY] = [
				(node.xPercent / 100) * containerRect.w,
				(node.yPercent / 100) * containerRect.h
			];
			const [offsetX, offsetY] = [mouseX - startX, mouseY - startY];

			lastPos = { x: mouseX, y: mouseY };
			let lastTime = performance.now();

			const handleMove = (e) => {
				if (!isDragging) return;
				const now = performance.now();
				const [x, y] = [e.clientX - rect.left - offsetX, e.clientY - rect.top - offsetY];

				velocity = {
					x: ((x - lastPos.x) / (now - lastTime)) * 16,
					y: ((y - lastPos.y) / (now - lastTime)) * 16
				};

				[lastPos.x, lastPos.y, lastTime] = [x, y, now];
				updatePosition(x, y);
			};

			const handleUp = () => {
				isDragging = false;
				element.style.cursor = 'grab';

				const startX = node.xPercent;
				const startY = node.yPercent;
				const targetX = node.originalX;
				const targetY = node.originalY;

				let currentX = startX;
				let currentY = startY;
				let velocityX = 0;
				let velocityY = 0;
				let lastTime = performance.now();

				const animate = () => {
					const now = performance.now();
					const deltaTime = (now - lastTime) / 16;
					lastTime = now;

					const dx = targetX - currentX;
					const dy = targetY - currentY;

					velocityX += dx * springConfig.stiffness * deltaTime;
					velocityY += dy * springConfig.stiffness * deltaTime;

					velocityX *= springConfig.damping;
					velocityY *= springConfig.damping;

					currentX += velocityX;
					currentY += velocityY;

					node.xPercent = currentX;
					node.yPercent = currentY;
					nodes = [...nodes];

					if (
						Math.abs(dx) > springConfig.precision ||
						Math.abs(dy) > springConfig.precision ||
						Math.abs(velocityX) > springConfig.precision ||
						Math.abs(velocityY) > springConfig.precision
					) {
						animationId = requestAnimationFrame(animate);
					}
				};

				animationId = requestAnimationFrame(animate);
				document.removeEventListener('pointermove', handleMove);
				document.removeEventListener('pointerup', handleUp);
			};

			document.addEventListener('pointermove', handleMove);
			document.addEventListener('pointerup', handleUp);
		};

		element.addEventListener('pointerdown', handleDown);
		return { destroy: () => element.removeEventListener('pointerdown', handleDown) };
	};

	onMount(() => {
		const updateContainerSize = () => {
			if (!forceGraphContainer) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			containerRect = { w: rect.width, h: rect.height };
		};

		updateContainerSize();

		setTimeout(() => {
			nodes = shapesConfig.map((config, i) => ({
				id: i,
				r: 45 + Math.floor(Math.random() * 11),
				xPercent: config.xPercent,
				yPercent: config.yPercent,
				originalX: config.xPercent,
				originalY: config.yPercent,
				shapeType: config.type,
				fillColor: ['var(--orange-9)', 'var(--pink-9)'][i % 2],
				strokeColor: ['var(--orange-6)', 'var(--pink-6)'][i % 2],
				strokeWidth: 1,
				...config
			}));
		}, 0);

		const resizeObserver = new ResizeObserver(() => {
			updateContainerSize();
			nodes = [...nodes];
		});

		resizeObserver.observe(forceGraphContainer);
		return () => resizeObserver.disconnect();
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
					width: {node.r * 2}px;
					height: {node.r * 2}px;
					left: {node.xPercent}%;
					top: {node.yPercent}%;
				"
			>
				{#if node.shapeType === 'blob'}
					<Blob
						pointCount={node.pointCount}
						strength={node.strength}
						seed={node.seed}
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{:else if node.shapeType === 'squircle'}
					<Squircle
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						smoothing={node.smoothing}
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
						n1={node.n1}
						n2={node.n2}
						n3={node.n3}
						fillColor={node.fillColor}
						strokeColor={node.strokeColor}
						strokeWidth={node.strokeWidth}
					/>
				{/if}
			</div>
		{/each}
	</div>
</section>
