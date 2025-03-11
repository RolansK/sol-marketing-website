<script>
	import GPerlinWave from '$lib/components/webgl/GPerlinWave.svelte';
</script>

<section class="hero">
	<GPerlinWave
		width="100vw"
		height="30vh"
		colors={[
			{ color: '#fae6e6', position: 0 },
			{ color: '#e03100', position: 0.35 },
			{ color: '#6e008a', position: 0.87 },
			{ color: '#0e0014', position: 1 }
		]}
		noiseSpeed={10}
	/>
</section>
