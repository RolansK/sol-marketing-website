<script>
	import Tiles from '$lib/components/webgl/Tiles.svelte';

	let {
		width = '100%',
		height = '100%',
		gap = 5,
		offsetToggle = 'row',
		offsetPercent = 0,
		offsetRow = 2,
		state1 = {
			color: '#FFAB94',
			size: 1.75,
			radius: 100,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		state2 = {
			color: '#FF30AD',
			size: 5,
			radius: 100,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		noiseType = 0,
		noiseScale = 2.25,
		noiseSpeed = 28,
		dpi = 2,
		fps = 120
	} = $props();
</script>

<section class="components nopadding tiles">
	<div class="container">
		<div>
			<Tiles
				{width}
				{height}
				{gap}
				{offsetToggle}
				{offsetPercent}
				{offsetRow}
				{state1}
				{state2}
				{noiseType}
				{noiseScale}
				{noiseSpeed}
				{dpi}
				{fps}
			/>
		</div>
	</div>

	<span class="right">
		<h2>Same same,<br />but different</h2>
		<p>
			What if the dots could animate themselves? They can. Tweak the parameters, choose the noise
			type and you're good to go.
		</p>
	</span>
</section>
