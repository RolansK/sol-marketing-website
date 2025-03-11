<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import Blob from '$lib/components/svg/Blob.svelte';
	import Squircle from '$lib/components/svg/Squircle.svelte';
	import Polygon from '$lib/components/svg/Polygon.svelte';
	import Super from '$lib/components/svg/Super.svelte';

	let forceGraphContainer;
	let nodes = $state([]);
	let simulation = $state(null);
	let draggedNode = $state(null);
	let isDragging = $state(false);
	let prevW = 0;
	let prevH = 0;

	onMount(() => {
		const handleResize = () => {
			if (!simulation) return;
			requestAnimationFrame(() => {
				const { clientWidth: w, clientHeight: h } = forceGraphContainer;
				if (!w || !h || (w === prevW && h === prevH)) return;

				if (prevW > 0 && prevH > 0) {
					const xRatio = w / prevW;
					const yRatio = h / prevH;

					nodes = nodes.map((node) => ({
						...node,
						x: Math.max(node.r, Math.min(w - node.r, node.x * xRatio)),
						y: Math.max(node.r, Math.min(h - node.r, node.y * yRatio))
					}));
				}

				// Update center and collision forces only
				simulation.force('center', d3.forceCenter(w / 2, h / 2));
				simulation.force(
					'collision',
					d3.forceCollide((d) => d.r + 1)
				);

				simulation.nodes(nodes);
				simulation.alpha(0.3).restart();

				prevW = w;
				prevH = h;
			});
		};

		const resizeObserver = new ResizeObserver(handleResize);
		if (forceGraphContainer) {
			resizeObserver.observe(forceGraphContainer);
		}

		const initSimulation = () => {
			const { clientWidth: w, clientHeight: h } = forceGraphContainer;
			if (w === 0 || h === 0) {
				requestAnimationFrame(initSimulation);
				return;
			}

			nodes = d3.range(20).map((i) => ({
				id: i,
				r: Math.random() * 30 + 60,
				x: Math.random() * w,
				y: Math.random() * h,
				shapeType: ['blob', 'squircle', 'polygon', 'super'][i % 4]
			}));

			simulation = d3
				.forceSimulation(nodes)
				.force('charge', d3.forceManyBody().strength(-30))
				.force('center', d3.forceCenter(w / 2, h / 2))
				.force(
					'collision',
					d3.forceCollide((d) => d.r + 1)
				)
				.alphaDecay(0.01)
				.on('tick', () => {
					nodes = [...nodes];
					nodes.forEach((node) => {
						node.x = Math.max(node.r, Math.min(w - node.r, node.x));
						node.y = Math.max(node.r, Math.min(h - node.r, node.y));
					});
				});

			const moveHandler = ({ clientX, clientY }) => {
				if (!isDragging || !draggedNode) return;
				const rect = forceGraphContainer.getBoundingClientRect();
				[draggedNode.fx, draggedNode.fy] = [clientX - rect.left, clientY - rect.top];
			};

			document.addEventListener('pointermove', moveHandler);
			document.addEventListener('pointerup', () => {
				isDragging = false;
				draggedNode && ([draggedNode.fx, draggedNode.fy] = [null, null]);
				draggedNode = null;
			});
		};

		requestAnimationFrame(initSimulation);

		return () => {
			resizeObserver.disconnect();
			document.removeEventListener('pointermove', moveHandler);
			simulation?.stop();
		};
	});

	function handleNodePointerDown(e, node) {
		e.preventDefault();
		(isDragging = true) && (draggedNode = node);
		simulation?.alphaTarget(0.1).restart();
		[node.fx, node.fy] = [node.x, node.y];
	}
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
				style="
					width: {node.r * 2}px;
					height: {node.r * 2}px;
					left: {node.x - node.r}px;
					top: {node.y - node.r}px;
					cursor: {isDragging && draggedNode === node ? 'grabbing' : 'grab'};
				"
				onpointerdown={(e) => handleNodePointerDown(e, node)}
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
