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
		{ type: 'squircle', xPercent: 25, yPercent: 30 },
		{ type: 'super', xPercent: 75, yPercent: 25, ratio: 1.5, m: 8 },
		{ type: 'super', xPercent: 60, yPercent: 70, ratio: 1.8, m: 12 },
		{ type: 'super', xPercent: 35, yPercent: 65, ratio: 2.2, m: 15 },
		{ type: 'super', xPercent: 15, yPercent: 80, ratio: 1.3, m: 7 },
		{ type: 'super', xPercent: 85, yPercent: 45, ratio: 1.7, m: 10 },
		{ type: 'super', xPercent: 45, yPercent: 15, ratio: 2.0, m: 20 },
		{ type: 'polygon', xPercent: 80, yPercent: 85, cornerCount: 5, bend: 0.3 },
		{ type: 'polygon', xPercent: 25, yPercent: 50, cornerCount: 3, bend: 0.2 },
		{ type: 'polygon', xPercent: 65, yPercent: 30, cornerCount: 6, bend: 0.1 },
		{ type: 'blob', xPercent: 40, yPercent: 85 },
		{ type: 'blob', xPercent: 15, yPercent: 15 }
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
					display: flex;
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
