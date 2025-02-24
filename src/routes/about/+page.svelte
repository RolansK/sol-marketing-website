<script>
	import DotGrid from '$lib/components/solConvert/webgl/DotGrid.svelte';
	import GLinear from '$lib/components/solConvert/webgl/GLinear.svelte';
	import GPerlinWave from '$lib/components/solConvert/webgl/GPerlinWave.svelte';
	import GRadial from '$lib/components/solConvert/webgl/GRadial.svelte';
	import Tiles from '$lib/components/solConvert/webgl/Tiles.svelte';
</script>

<svelte:head>
	<title>Teyah | About</title>
	<meta name="description" content="Learn more about Teyah." />
</svelte:head>

<section>
	<p>
		KVK: 82109923 <br />
		VAT: NL003642162B19
	</p>
</section>

<div class="webgl-grid">
	<div class="webgl-item">
		<DotGrid
			width={100}
			height={100}
			state1={{ color: '#ffab94', size: 1.75, radius: 100, rotX: 0, rotY: 0, rotZ: 0 }}
			state2={{ color: '#de24ad', size: 3, radius: 100, rotX: 45, rotY: 45, rotZ: 45 }}
			hoverArea={120}
			magnet={10}
		/>
	</div>
	<div class="webgl-item">
		<GLinear
			width={100}
			height={100}
			colors={[
				{ color: '#ffadd9', position: 0 },
				{ color: '#007061', position: 0.5 },
				{ color: '#000042', position: 1 }
			]}
			waveSpeed={2}
		/>
	</div>
	<div class="webgl-item">
		<GPerlinWave
			width={100}
			height={100}
			colors={[
				{ color: '#fae6e6', position: 0 },
				{ color: '#e03100', position: 0.35 },
				{ color: '#6e008a', position: 0.87 },
				{ color: '#0e0014', position: 1 }
			]}
			noiseSpeed={10}
		/>
	</div>
	<div class="webgl-item">
		<GRadial
			width={100}
			height={100}
			colors={[
				{ color: '#ffadd9', position: 0 },
				{ color: '#007061', position: 0.5 },
				{ color: '#000042', position: 1 }
			]}
			waveSpeed={2}
		/>
	</div>
	<div class="webgl-item">
		<Tiles
			width={100}
			height={100}
			state1={{ color: '#ffab94', size: 1.75, radius: 100, rotX: 0, rotY: 0, rotZ: 0 }}
			state2={{ color: '#de24ad', size: 3, radius: 100, rotX: 45, rotY: 45, rotZ: 45 }}
			noiseSpeed={1}
		/>
	</div>
</div>

<style>
	.webgl-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 2rem;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.webgl-item {
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
		background: #0000000a;
	}
</style>
