<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let forceGraphContainer;
	let nodes = $state([]);
	let simulation = $state(null);
	let draggedNode = $state(null);
	let isDragging = $state(false);

	onMount(() => {
		const { clientWidth: w, clientHeight: h } = forceGraphContainer;

		nodes = d3.range(25).map((i) => ({
			id: i,
			r: Math.random() * 16 + 8,
			x: Math.random() * w,
			y: Math.random() * h,
			initialX: Math.random() * w,
			initialY: Math.random() * h
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
				onpointerdown={(e) => handleNodePointerDown(e, node)}
			></div>
		{/each}
	</div>
</section>
