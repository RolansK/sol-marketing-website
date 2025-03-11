<script>
	import DemoVideo from '$lib/components/DemoVideo.svelte';
	import GPerlinWave from '$lib/components/webgl/GPerlinWave.svelte';
</script>

<section class="demo">
	<GPerlinWave
		width="100vw"
		height="100vh"
		colors={[
			{ color: '#ffffff', position: 0 },
			{ color: '#e43817', position: 0.25 },
			{ color: '#5a03a0', position: 0.9 },
			{ color: '#100424', position: 1 }
		]}
		grainScale={1}
		grainSpeed={50}
		grainStr={0.1}
		noiseScale={2}
		noiseSpeed={10}
		waveScale={40}
		waveSpeed={0}
		dpi={1}
		position="absolute"
	/>
	<DemoVideo />
</section>
