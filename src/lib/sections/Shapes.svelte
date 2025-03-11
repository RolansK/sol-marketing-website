<script>
	import ComponentSection from '$lib/components/ComponentSection.svelte';
	import { onMount, tick } from 'svelte';
	import * as d3 from 'd3';

	let forceGraphContainer;

	let nodes = $state([]);
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let simulation = $state(null);
	let draggedNode = $state(null);
	let isDragging = $state(false);

	// Create nodes when component mounts
	onMount(async () => {
		// Wait for DOM to be ready
		await tick();

		// Get dimensions from container
		containerWidth = forceGraphContainer.clientWidth;
		containerHeight = forceGraphContainer.clientHeight;

		// Create nodes with dynamic dimensions
		const tempNodes = [];
		for (let i = 0; i < 50; i++) {
			tempNodes.push({
				id: i,
				x: Math.random() * containerWidth,
				y: Math.random() * containerHeight,
				r: Math.random() * 8 + 3,
				initialX: Math.random() * containerWidth,
				initialY: Math.random() * containerHeight
			});
		}
		nodes = tempNodes;

		// Create force simulation
		simulation = d3
			.forceSimulation(nodes)
			.force('charge', d3.forceManyBody().strength(-30))
			.force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
			.force(
				'collision',
				d3.forceCollide().radius((d) => d.r + 1)
			)
			.force('x', d3.forceX((d) => d.initialX).strength(0.1))
			.force('y', d3.forceY((d) => d.initialY).strength(0.1))
			.alphaDecay(0.01)
			.on('tick', () => {
				// Force reactivity update
				nodes = [...nodes];
			});

		// Fix positions within boundaries
		simulation.on('tick.bounds', () => {
			nodes.forEach((node) => {
				// Keep nodes within container boundaries
				node.x = Math.max(node.r, Math.min(containerWidth - node.r, node.x));
				node.y = Math.max(node.r, Math.min(containerHeight - node.r, node.y));
			});
		});

		// Set up global mouse events for dragging
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			if (simulation) simulation.stop();
		};
	});

	// Handle node dragging
	function handleNodeMouseDown(event, node) {
		if (!simulation) return;

		event.preventDefault();
		isDragging = true;
		draggedNode = node;
		simulation.alphaTarget(0.1).restart();
		node.fx = node.x;
		node.fy = node.y;
	}

	function handleMouseMove(event) {
		if (!isDragging || !draggedNode || !simulation) return;

		// Update node position based on mouse movement
		const rect = forceGraphContainer.getBoundingClientRect();
		draggedNode.fx = event.clientX - rect.left;
		draggedNode.fy = event.clientY - rect.top;
	}

	function handleMouseUp() {
		if (!isDragging || !draggedNode || !simulation) return;

		isDragging = false;
		simulation.alphaTarget(0);
		draggedNode.fx = null;
		draggedNode.fy = null;
		draggedNode = null;
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
				class="node"
				role="button"
				tabindex="0"
				aria-label="Draggable node"
				style="
					width: {node.r * 2}px;
					height: {node.r * 2}px;
					left: {node.x - node.r}px;
					top: {node.y - node.r}px;
					cursor: {isDragging && draggedNode === node ? 'grabbing' : 'grab'};
				"
				onmousedown={(e) => handleNodeMouseDown(e, node)}
			></div>
		{/each}
	</div>
</section>
