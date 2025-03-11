<script>
	import { onMount } from 'svelte';
	import Blob from '$lib/components/svg/Blob.svelte';
	import Squircle from '$lib/components/svg/Squircle.svelte';
	import Polygon from '$lib/components/svg/Polygon.svelte';
	import Super from '$lib/components/svg/Super.svelte';

	let forceGraphContainer;
	let nodes = $state([]);
	let containerRect = $state({ w: 0, h: 0 });

	const dragAction = (element, node) => {
		let lastPos = { x: 0, y: 0 };
		let velocity = { x: 0, y: 0 };
		let lastTime = 0;
		let isDragging = false;
		let animationId = null;

		function updatePosition(x, y) {
			const boundedX = Math.max(node.r, Math.min(containerRect.w - node.r, x));
			const boundedY = Math.max(node.r, Math.min(containerRect.h - node.r, y));

			node.xPercent = (boundedX / containerRect.w) * 100;
			node.yPercent = (boundedY / containerRect.h) * 100;

			nodes = [...nodes]; // Trigger reactivity
		}

		function handleDown(e) {
			e.preventDefault();
			animationId && (cancelAnimationFrame(animationId), (animationId = null));

			isDragging = true;
			element.style.cursor = 'grabbing';

			const pixelX = (node.xPercent / 100) * containerRect.w;
			const pixelY = (node.yPercent / 100) * containerRect.h;

			const { left, top } = forceGraphContainer.getBoundingClientRect();
			const { clientX, clientY } = e;
			const [mouseX, mouseY] = [clientX - left, clientY - top];
			const [offsetX, offsetY] = [mouseX - pixelX, mouseY - pixelY];

			[lastTime, velocity] = [performance.now(), { x: 0, y: 0 }];
			lastPos = { x: mouseX, y: mouseY };

			function handleMove(e) {
				if (!isDragging) return;

				const now = performance.now();
				const deltaTime = now - lastTime;
				const rect = forceGraphContainer.getBoundingClientRect();

				const newPos = {
					x: e.clientX - rect.left - offsetX,
					y: e.clientY - rect.top - offsetY
				};

				if (deltaTime > 0) {
					velocity.x = ((newPos.x - lastPos.x) / deltaTime) * 16; // Scale to approximately pixels per frame
					velocity.y = ((newPos.y - lastPos.y) / deltaTime) * 16;
				}

				lastPos = newPos;
				lastTime = now;

				updatePosition(newPos.x, newPos.y);
			}

			function handleUp(e) {
				if (!isDragging) return;
				isDragging = false;
				element.style.cursor = 'grab';

				function applyInertia() {
					const friction = 0.95;
					velocity.x *= friction;
					velocity.y *= friction;

					const pixelX = (node.xPercent / 100) * containerRect.w;
					const pixelY = (node.yPercent / 100) * containerRect.h;

					updatePosition(pixelX + velocity.x, pixelY + velocity.y);

					if (Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5) {
						animationId = requestAnimationFrame(applyInertia);
					}
				}

				if (Math.abs(velocity.x) > 0.5 || Math.abs(velocity.y) > 0.5) {
					animationId = requestAnimationFrame(applyInertia);
				}

				document.removeEventListener('pointermove', handleMove);
				document.removeEventListener('pointerup', handleUp);
			}

			document.addEventListener('pointermove', handleMove);
			document.addEventListener('pointerup', handleUp);
		}

		element.addEventListener('pointerdown', handleDown);

		return {
			destroy() {
				element.removeEventListener('pointerdown', handleDown);
				if (animationId) {
					cancelAnimationFrame(animationId);
				}
			}
		};
	};

	onMount(() => {
		const updateContainerSize = () => {
			if (!forceGraphContainer) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			containerRect = { w: rect.width, h: rect.height };
		};

		updateContainerSize();

		setTimeout(() => {
			const centerX = containerRect.w / 2;
			const centerY = containerRect.h / 2;
			const maxRadiusX = centerX * 0.95; // 95% of available width
			const maxRadiusY = centerY * 0.95; // 95% of available height
			const minDistance = 70; // Minimum distance between nodes

			const positions = [];

			for (let i = 0; i < 20; i++) {
				let valid = false;
				let attempts = 0;
				let x, y;
				let xPercent, yPercent;

				const goldenAngle = Math.PI * (3 - Math.sqrt(5));
				const angle = i * goldenAngle;

				while (!valid && attempts < 50) {
					const normalizedRandom = Math.random();
					const radiusFactor = Math.sqrt(normalizedRandom);

					const radiusX = radiusFactor * maxRadiusX;
					const radiusY = radiusFactor * maxRadiusY;

					x = centerX + Math.cos(angle) * radiusX;
					y = centerY + Math.sin(angle) * radiusY;

					xPercent = (x / containerRect.w) * 100;
					yPercent = (y / containerRect.h) * 100;

					valid = positions.every((pos) => {
						const dx = pos.x - x;
						const dy = pos.y - y;
						return Math.sqrt(dx * dx + dy * dy) >= minDistance;
					});

					attempts++;
				}

				positions.push({ x, y, xPercent, yPercent });
			}

			nodes = positions.map((pos, i) => ({
				id: i,
				r: Math.random() * 10 + 50,
				xPercent: pos.xPercent,
				yPercent: pos.yPercent,
				shapeType: ['blob', 'squircle', 'polygon', 'super'][i % 4]
			}));
		}, 0);

		const resizeObserver = new ResizeObserver(() => {
			updateContainerSize();
			if (nodes.length) {
				nodes = [...nodes];
			}
		});

		resizeObserver.observe(forceGraphContainer);

		return () => {
			resizeObserver.disconnect();
		};
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
				"
			>
				{#if node.shapeType === 'blob'}
					<Blob />
				{:else if node.shapeType === 'squircle'}
					<Squircle />
				{:else if node.shapeType === 'polygon'}
					<Polygon cornerCount={Math.floor(Math.random() * 5) + 3} bend={Math.random()} />
				{:else if node.shapeType === 'super'}
					<Super ratio={1 + Math.random()} m={Math.floor(Math.random() * 20) + 5} />
				{/if}
			</div>
		{/each}
	</div>
</section>
