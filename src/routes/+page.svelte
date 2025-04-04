<script>
	import Hero from '$lib/sections/Hero.svelte';
	import Demo from '$lib/sections/Demo.svelte';
	import Shapes from '$lib/sections/Shapes.svelte';
	import Gradients from '$lib/sections/Gradients.svelte';
	import Dots from '$lib/sections/Dots.svelte';
	import Tiles from '$lib/sections/Tiles.svelte';
	import Features from '$lib/sections/Features.svelte';
	import Pricing from '$lib/sections/Pricing.svelte';
</script>

<svelte:head>
	<title>Sol - visual plugin for Framer</title>
	<meta
		name="description"
		content="The ultimate graphics plugin for Framer. Create interactive grids, gradients, squircles and blobs with a couple of clicks, all without leaving the canvas."
	/>
</svelte:head>

<Hero />
<Demo />
<Shapes />
<Gradients />
<Dots />
<Tiles />
<Features />
<Pricing />
