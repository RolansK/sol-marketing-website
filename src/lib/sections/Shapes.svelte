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

	function generateEvenDistribution(w, h, n = 15) {
		// Generate initial grid points with jitter
		const cols = Math.ceil(Math.sqrt((n * w) / h));
		const rows = Math.ceil(n / cols);
		const cw = w / cols,
			ch = h / rows;

		let points = Array.from({ length: n }, (_, i) => ({
			x: ((i % cols) + 0.5) * cw + (Math.random() - 0.5) * cw * 0.5,
			y: (Math.floor(i / cols) + 0.5) * ch + (Math.random() - 0.5) * ch * 0.5
		})).map((p) => ({ x: Math.max(0, Math.min(w, p.x)), y: Math.max(0, Math.min(h, p.y)) }));

		// Lloyd's relaxation iterations
		for (let i = 0; i < 3; i++) {
			points = points.map((p) => {
				const minDist = Math.min(
					...points.map((q) => (p === q ? Infinity : Math.hypot(p.x - q.x, p.y - q.y)))
				);

				const samples = Array.from({ length: 20 }, () => {
					const a = Math.random() * Math.PI * 2;
					const r = minDist * 1.5 * Math.random();
					return { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
				}).filter((s) => s.x >= 0 && s.x < w && s.y >= 0 && s.y < h);

				const centroid = samples.reduce(
					(acc, s) => {
						const closest = points.reduce(
							(a, b, j) =>
								Math.hypot(s.x - b.x, s.y - b.y) < a.d
									? { i: j, d: Math.hypot(s.x - b.x, s.y - b.y) }
									: a,
							{ d: Infinity, i: -1 }
						);
						return closest.i === points.indexOf(p)
							? { x: acc.x + s.x, y: acc.y + s.y, c: acc.c + 1 }
							: acc;
					},
					{ x: 0, y: 0, c: 0 }
				);

				return centroid.c ? { x: centroid.x / centroid.c, y: centroid.y / centroid.c } : p;
			});
		}

		return points.map((p) => ({
			x: p.x,
			y: p.y,
			xPercent: (p.x / w) * 100,
			yPercent: (p.y / h) * 100
		}));
	}

	onMount(() => {
		const updateContainerSize = () => {
			if (!forceGraphContainer) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			containerRect = { w: rect.width, h: rect.height };
		};

		updateContainerSize();

		setTimeout(() => {
			const positions = generateEvenDistribution(containerRect.w, containerRect.h, 15);

			nodes = positions.map((pos, i) => ({
				id: i,
				r: 55,
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
