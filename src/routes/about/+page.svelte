<script>
	import DotGrid from '$lib/components/solConvert/webgl/DotGrid.svelte';
	import GLinear from '$lib/components/solConvert/webgl/GLinear.svelte';
	import GPerlin from '$lib/components/solConvert/webgl/GPerlin.svelte';
	import GPerlinWave from '$lib/components/solConvert/webgl/GPerlinWave.svelte';
	import GRadial from '$lib/components/solConvert/webgl/GRadial.svelte';
	import Tiles from '$lib/components/solConvert/webgl/Tiles.svelte';
	import Blob from '$lib/components/solConvert/svg/Blob.svelte';
	import Polygon from '$lib/components/solConvert/svg/Polygon.svelte';
	import Squircle from '$lib/components/solConvert/svg/Squircle.svelte';
	import Super from '$lib/components/solConvert/svg/Super.svelte';
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
	<DotGrid
		width={100}
		height={100}
		state1={{ color: '#ffab94', size: 1.75, radius: 100, rotX: 0, rotY: 0, rotZ: 0 }}
		state2={{ color: '#de24ad', size: 3, radius: 100, rotX: 45, rotY: 45, rotZ: 45 }}
		hoverArea={120}
		magnet={10}
	/>
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
	<GPerlin
		width={100}
		height={100}
		colors={[
			{ color: '#ffb8c8', position: 0.25 },
			{ color: '#af3db3', position: 0.4 },
			{ color: '#42006b', position: 0.6 },
			{ color: '#1d0156', position: 0.75 }
		]}
		noiseSpeed={10}
	/>
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
	<Tiles
		width={100}
		height={100}
		state1={{ color: '#ffab94', size: 1.75, radius: 100, rotX: 0, rotY: 0, rotZ: 0 }}
		state2={{ color: '#de24ad', size: 3, radius: 100, rotX: 45, rotY: 45, rotZ: 45 }}
		noiseSpeed={100}
	/>
	<div class="webgl-item">
		<Polygon
			cornerCount={6}
			bend={0.3}
			fillType="linear"
			fillColor="#FFE0DB"
			colors={['#FFE0DB', '#EB4C2D']}
			angle={45}
			strokeColor="#EB4C2D"
			strokeWidth={1}
			shadow={[
				{ x: 5, y: 5, blur: 10, color: 'rgba(235, 76, 45, 1.0)' },
				{ x: 0, y: 20, blur: 8, color: 'rgba(0, 0, 0, 1.0)', outside: true }
			]}
		/>
	</div>
	<div class="webgl-item">
		<Blob
			fillType="linear"
			fillColor="#FFE0DB"
			colors={['#FFE0DB', '#EB4C2D']}
			angle={45}
			strokeColor="#EB4C2D"
			strokeWidth={1}
			pointCount={5}
			strength={5}
			seed={9}
			shadow={[
				{ x: 5, y: 5, blur: 10, color: 'rgba(235, 76, 45, 1.0)' },
				{ x: 0, y: 0, blur: 8, color: 'rgba(0, 0, 0, 1.0)', outside: true }
			]}
		/>
	</div>
	<div class="webgl-item">
		<Blob
			fillType="linear"
			fillColor="#FFE0DB"
			colors={['#FFE0DB', '#EB4C2D']}
			angle={45}
			strokeColor="#EB4C2D"
			strokeWidth={1}
			pointCount={5}
			strength={5}
			seed={9}
			shadow={[
				{ x: 5, y: 5, blur: 1, color: 'rgba(235, 76, 45, 1.0)' },
				{ x: 0, y: 0, blur: 8, color: 'rgba(0, 0, 0, 1.0)', outside: true }
			]}
		/>
	</div>
	<div class="webgl-item">
		<Squircle
			borderRadius="20px"
			smoothing={1}
			fillType="linear"
			fillColor="#FFE0DB"
			colors={['#FFE0DB', '#EB4C2D']}
			angle={45}
			strokeColor="#EB4C2D"
			strokeWidth={1}
			shadow={[
				{ x: 5, y: 5, blur: 10, color: 'rgba(235, 76, 45, 1.0)' },
				{ x: 0, y: 0, blur: 8, color: 'rgba(0, 0, 0, 1.0)', outside: true }
			]}
		/>
	</div>
	<div class="webgl-item">
		<Super
			ratio={1.3}
			m={47}
			n1={15}
			n2={22}
			n3={28}
			fillType="linear"
			fillColor="#FFE0DB"
			colors={['#FFE0DB', '#EB4C2D']}
			angle={45}
			strokeColor="#EB4C2D"
			strokeWidth={1}
			shadow={[
				{ x: 5, y: 5, blur: 10, color: 'rgba(235, 76, 45, 1.0)' },
				{ x: 0, y: 0, blur: 8, color: 'rgba(0, 0, 0, 1.0)', outside: true }
			]}
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
		overflow: visible;
	}
</style>
