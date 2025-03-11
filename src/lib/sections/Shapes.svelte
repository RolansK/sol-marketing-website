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

			node.x = boundedX;
			node.y = boundedY;
			nodes = [...nodes]; // Trigger reactivity
		}

		function handleDown(e) {
			e.preventDefault();
			animationId && (cancelAnimationFrame(animationId), (animationId = null));

			isDragging = true;
			element.style.cursor = 'grabbing';

			const { left, top } = forceGraphContainer.getBoundingClientRect();
			const { clientX, clientY } = e;
			const [mouseX, mouseY] = [clientX - left, clientY - top];
			const [offsetX, offsetY] = [mouseX - node.x, mouseY - node.y];

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

				// Calculate velocity
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

				// Apply inertia
				function applyInertia() {
					const friction = 0.95;
					velocity.x *= friction;
					velocity.y *= friction;

					updatePosition(node.x + velocity.x, node.y + velocity.y);

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
			// Initialize nodes with random positions
			nodes = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				r: Math.random() * 10 + 50,
				x: Math.random() * (containerRect.w - 120) + 60, // Ensure within bounds
				y: Math.random() * (containerRect.h - 120) + 60, // Ensure within bounds
				shapeType: ['blob', 'squircle', 'polygon', 'super'][i % 4]
			}));
		}, 0);

		const resizeObserver = new ResizeObserver(() => {
			updateContainerSize();

			if (nodes.length) {
				nodes = nodes.map((node) => ({
					...node,
					x: Math.max(node.r, Math.min(containerRect.w - node.r, node.x)),
					y: Math.max(node.r, Math.min(containerRect.h - node.r, node.y))
				}));
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
					left: {node.x - node.r}px;
					top: {node.y - node.r}px;
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
