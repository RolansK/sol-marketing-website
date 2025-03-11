<script>
	import { onMount, tick } from 'svelte';
	import * as d3 from 'd3';

	let forceGraphContainer;

	let nodes = $state([]);
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let simulation = $state(null);
	let draggedNode = $state(null);
	let isDragging = $state(false);

	onMount(async () => {
		await tick();

		const { clientWidth: w, clientHeight: h } = forceGraphContainer;
		[containerWidth, containerHeight] = [w, h];
		const centerX = w / 2,
			centerY = h / 2;

		nodes = Array.from({ length: 50 }, (_, i) => ({
			id: i,
			x: Math.random() * w,
			y: Math.random() * h,
			r: Math.random() * 16 + 8,
			initialX: Math.random() * w,
			initialY: Math.random() * h
		}));

		simulation = d3
			.forceSimulation(nodes)
			.force('charge', d3.forceManyBody().strength(-30))
			.force('center', d3.forceCenter(centerX, centerY))
			.force(
				'collision',
				d3.forceCollide().radius((d) => d.r + 1)
			)
			.force('x', d3.forceX((d) => d.initialX).strength(0.1))
			.force('y', d3.forceY((d) => d.initialY).strength(0.1))
			.alphaDecay(0.01)
			.on('tick', () => (nodes = [...nodes]))
			.on('tick.bounds', () => nodes.forEach(clampPosition));

		function clampPosition(node) {
			node.x = Math.max(node.r, Math.min(containerWidth - node.r, node.x));
			node.y = Math.max(node.r, Math.min(containerHeight - node.r, node.y));
		}

		const moveHandler = (e) => {
			if (!isDragging || !draggedNode) return;
			const rect = forceGraphContainer.getBoundingClientRect();
			[draggedNode.fx, draggedNode.fy] = [e.clientX - rect.left, e.clientY - rect.top];
		};

		const upHandler = () => {
			if (!isDragging) return;
			isDragging = false;
			simulation?.alphaTarget(0);
			if (draggedNode) [draggedNode.fx, draggedNode.fy] = [null, null];
			draggedNode = null;
		};

		document.addEventListener('mousemove', moveHandler);
		document.addEventListener('mouseup', upHandler);

		return () => {
			document.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('mouseup', upHandler);
			simulation?.stop();
		};
	});

	function handleNodeMouseDown(e, node) {
		e.preventDefault();
		isDragging = true;
		draggedNode = node;
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
