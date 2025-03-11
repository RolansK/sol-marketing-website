<script>
	import ComponentSection from '$lib/components/ComponentSection.svelte';
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	let forceGraph;
	let containerWidth = 0;
	let containerHeight = 0;

	onMount(() => {
		// Get dimensions from CSS-computed values
		containerWidth = forceGraph.parentElement.clientWidth;
		containerHeight = forceGraph.parentElement.clientHeight;

		// Create nodes with dynamic dimensions
		const nodes = Array.from({ length: 50 }, () => ({
			x: Math.random() * containerWidth,
			y: Math.random() * containerHeight,
			r: Math.random() * 8 + 3,
			initialX: null,
			initialY: null
		}));

		const svg = d3.select(forceGraph).attr('width', containerWidth).attr('height', containerHeight);

		// First positioning
		nodes.forEach((d) => {
			d.initialX = d.x;
			d.initialY = d.y;
		});

		// Create force simulation
		const simulation = d3
			.forceSimulation(nodes)
			.force('charge', d3.forceManyBody().strength(-15)) // Reduced repulsion
			.force('center', d3.forceCenter(containerWidth / 2, containerHeight / 2))
			.force(
				'collision',
				d3.forceCollide().radius((d) => d.r + 1)
			)
			.force('x', d3.forceX((d) => d.initialX).strength(0.1)) // Positional forces
			.force('y', d3.forceY((d) => d.initialY).strength(0.1))
			.alphaDecay(0.01); // Slower simulation decay

		// Modify drag handling
		const dragHandling = d3
			.drag()
			.on('start', (event, d) => {
				if (!event.active) simulation.alphaTarget(0.1).restart();
				d.fx = d.x;
				d.fy = d.y;
			})
			.on('drag', (event, d) => {
				d.fx = event.x;
				d.fy = event.y;
			})
			.on('end', (event, d) => {
				if (!event.active) simulation.alphaTarget(0);
				d.fx = null; // Release fixed position
				d.fy = null;
			});

		// Create nodes in SVG and make them draggable
		const circles = svg
			.selectAll('circle')
			.data(nodes)
			.enter()
			.append('circle')
			.attr('r', (d) => d.r)
			.attr('cx', (d) => d.x)
			.attr('cy', (d) => d.y)
			.attr('class', 'node')
			.call(dragHandling);

		// Update circle positions on each tick
		simulation.on('tick', () => {
			circles.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
		});
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

	<svg bind:this={forceGraph} class="force-graph"></svg>
</section>
