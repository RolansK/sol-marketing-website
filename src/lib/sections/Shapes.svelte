<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import Blob from '$lib/components/svg/Blob.svelte';
	import Squircle from '$lib/components/svg/Squircle.svelte';

	let forceGraphContainer;
	let nodes = $state([]);
	let simulation = $state(null);
	let draggedNode = $state(null);
	let isDragging = $state(false);

	onMount(() => {
		const initSimulation = () => {
			const { clientWidth: w, clientHeight: h } = forceGraphContainer;
			if (w === 0 || h === 0) {
				// Check for valid dimensions
				requestAnimationFrame(initSimulation);
				return;
			}

			nodes = d3.range(20).map((i) => ({
				id: i,
				r: Math.random() * 30 + 60,
				x: Math.random() * w,
				y: Math.random() * h,
				initialX: Math.random() * w,
				initialY: Math.random() * h,
				isBlob: i % 2 === 0
			}));

			simulation = d3
				.forceSimulation(nodes)
				.force('charge', d3.forceManyBody().strength(-30))
				.force('center', d3.forceCenter(w / 2, h / 2))
				.force(
					'collision',
					d3.forceCollide((d) => d.r + 1)
				)
				.force('x', d3.forceX((d) => d.initialX).strength(0.1))
				.force('y', d3.forceY((d) => d.initialY).strength(0.1))
				.alphaDecay(0.01)
				.on('tick', () => {
					nodes = [...nodes]; // Trigger update
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
				{#if node.isBlob}
					<Blob />
				{:else}
					<Squircle />
				{/if}
			</div>
		{/each}
	</div>
</section>
