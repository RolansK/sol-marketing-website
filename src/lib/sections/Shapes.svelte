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
		{ type: 'super', xPercent: 58, yPercent: 13, ratio: 10, m: 60, n1: -14, n2: 5.1, n3: 38.5 },
		{ type: 'blob', xPercent: 22, yPercent: 7, pointCount: 40, strength: 2, seed: 17 },
		{ type: 'super', xPercent: 7, yPercent: 29, ratio: 1, m: 20, n1: 6, n2: -2, n3: 0.6 },
		{ type: 'super', xPercent: 71, yPercent: 33, ratio: 1, m: 6, n1: 48, n2: 22, n3: 28 },
		{ type: 'super', xPercent: 44.5, yPercent: 25.5, ratio: 25, m: 6, n1: 5, n2: 1, n3: 1.2 },
		{ type: 'super', xPercent: 20, yPercent: 40, ratio: 2.6, m: 14, n1: 1, n2: -0.1, n3: 1 },
		{ type: 'super', xPercent: 39, yPercent: 52, ratio: 1, m: 4, n1: 48, n2: 16, n3: 16 },
		{ type: 'blob', xPercent: 5, yPercent: 10, pointCount: 3, strength: 9, seed: 12 },
		{ type: 'super', xPercent: 63.5, yPercent: 48.8, ratio: 0.2, m: 16, n1: 23.1, n2: -5, n3: 4 },
		{
			type: 'super',
			xPercent: 45,
			yPercent: 65.2,
			ratio: 50,
			m: 10,
			n1: 28.2,
			n2: -30.8,
			n3: -3.8
		},
		{ type: 'super', xPercent: 72.5, yPercent: 80.5, ratio: 1, m: 6, n1: 9, n2: 50, n3: 10 },
		{ type: 'squircle', xPercent: 12.5, yPercent: 66.5, smoothing: 1 },
		{ type: 'polygon', xPercent: 35, yPercent: 85.5, cornerCount: 3, bend: 0.9 },
		{ type: 'polygon', xPercent: 15, yPercent: 45, cornerCount: 3, bend: 0.2 },
		{ type: 'polygon', xPercent: 65, yPercent: 23, cornerCount: 6, bend: 0.1 }
	];

	const dragAction = (el, node) => {
		let lastPos = { x: 0, y: 0 },
			velocity = { x: 0, y: 0 },
			animationId,
			dragging = false;
		const spring = {
			stiffness: 0.08,
			damping: 0.92,
			precision: 0.01
		};

		const updatePos = (x, y) => {
			let bx = Math.max(0, Math.min(containerRect.w - node.r * 2, x));
			let by = Math.max(0, Math.min(containerRect.h - node.r * 2, y));
			node.xPercent = (bx / containerRect.w) * 100;
			node.yPercent = (by / containerRect.h) * 100;
			nodes = [...nodes];
		};

		const pointerDown = (e) => {
			e.preventDefault();
			el.classList.add('dragging');
			cancelAnimationFrame(animationId);
			dragging = true;
			el.style.cursor = 'grabbing';
			let rect = forceGraphContainer.getBoundingClientRect();
			let mx = e.clientX - rect.left;
			let my = e.clientY - rect.top;

			let nodeX = (node.xPercent / 100) * containerRect.w;
			let nodeY = (node.yPercent / 100) * containerRect.h;
			let ox = mx - nodeX;
			let oy = my - nodeY;

			lastPos = { x: mx, y: my };
			let lastTime = performance.now();

			const pointerMove = (e) => {
				if (!dragging) return;
				let now = performance.now();
				let x = e.clientX - rect.left - ox;
				let y = e.clientY - rect.top - oy;
				velocity = {
					x: ((x - lastPos.x) / (now - lastTime)) * 16,
					y: ((y - lastPos.y) / (now - lastTime)) * 16
				};
				lastPos = { x, y };
				lastTime = now;
				updatePos(x, y);
			};

			const pointerUp = () => {
				el.classList.remove('dragging');
				dragging = false;
				el.style.cursor = 'grab';
				let currentX = node.xPercent,
					currentY = node.yPercent,
					vX = 0,
					vY = 0,
					lt = performance.now();

				const animate = () => {
					let now = performance.now();
					let dt = (now - lt) / 16;
					lt = now;
					let dx = node.originalX - currentX,
						dy = node.originalY - currentY;
					vX += dx * spring.stiffness * dt;
					vY += dy * spring.stiffness * dt;
					vX *= spring.damping;
					vY *= spring.damping;
					currentX += vX;
					currentY += vY;
					node.xPercent = currentX;
					node.yPercent = currentY;
					nodes = [...nodes];
					if (
						Math.abs(dx) > spring.precision ||
						Math.abs(dy) > spring.precision ||
						Math.abs(vX) > spring.precision ||
						Math.abs(vY) > spring.precision
					) {
						animationId = requestAnimationFrame(animate);
					}
				};

				animationId = requestAnimationFrame(animate);
				document.removeEventListener('pointermove', pointerMove);
				document.removeEventListener('pointerup', pointerUp);
			};

			document.addEventListener('pointermove', pointerMove);
			document.addEventListener('pointerup', pointerUp);
		};

		el.addEventListener('pointerdown', pointerDown);
		return { destroy: () => el.removeEventListener('pointerdown', pointerDown) };
	};

	onMount(() => {
		const updateSize = () => {
			if (forceGraphContainer) {
				let r = forceGraphContainer.getBoundingClientRect();
				containerRect = { w: r.width, h: r.height };
			}
		};

		updateSize();

		setTimeout(() => {
			nodes = shapesConfig.map((c, i) => ({
				id: i,
				r: 45 + Math.floor(Math.random() * 11),
				xPercent: c.xPercent,
				yPercent: c.yPercent,
				originalX: c.xPercent,
				originalY: c.yPercent,
				shapeType: c.type,
				fillColor: ['var(--orange-9)', 'var(--pink-9)'][i % 2],
				strokeColor: ['var(--orange-6)', 'var(--pink-6)'][i % 2],
				strokeWidth: 1,
				...c
			}));
		}, 0);

		const ro = new ResizeObserver(() => {
			updateSize();
			nodes = [...nodes];
		});

		ro.observe(forceGraphContainer);
		return () => ro.disconnect();
	});
</script>

<section id="components" class="components">
	<span class="left">
		<h2>Create a shape.<br />Any shape</h2>
		<p>
			Rounded rectangles are cool, but there's a bit more you can make with shape generators -
			flowers, stars, droplets, blobs, squircles… You get it, the list goes on.
		</p>
	</span>

	<div class="force-graph" bind:this={forceGraphContainer}>
		{#each nodes as node (node.id)}
			<div
				class="node"
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
