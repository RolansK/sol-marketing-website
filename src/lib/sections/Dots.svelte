<script>
	import DotGrid from '$lib/components/webgl/DotGrid.svelte';

	let {
		width = '100%',
		height = '100%',
		gap = 5.25,
		offsetToggle = 'row',
		offsetPercent = 0,
		offsetRow = 1,
		state1 = {
			color: '#FF69B8',
			size: 1.75,
			radius: 50,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		state2 = {
			color: '#FF4724',
			size: 4.5,
			radius: 100,
			rotX: 0,
			rotY: 0,
			rotZ: 0
		},
		falloff = 2,
		steepness = 1.5,
		transition = { type: 'spring', stiffness: 500, damping: 60 },
		magnetSmooth = 4,
		magnetValue = -10,
		pointerPosition = { x: -9999, y: -9999 },
		pointerArea = 320,
		dpi = 2,
		fps = 120,
		css = 'position: relative'
	} = $props();
</script>

<section class="components">
	<span class="left">
		<h2>Woah, what<br />is that?</h2>
		<p>
			Hover and see what happens. Yes, the dots react to mouse hover. Yes, you just tap and drag on
			mobile. Yes, it does feel quite satisfying.
		</p>
	</span>

	<div class="container">
		<div>
			<DotGrid
				{width}
				{height}
				{gap}
				{offsetToggle}
				{offsetPercent}
				{offsetRow}
				{state1}
				{state2}
				{falloff}
				{steepness}
				{transition}
				{magnetSmooth}
				{magnetValue}
				{pointerPosition}
				{pointerArea}
				{dpi}
				{fps}
				{css}
			/>
		</div>
	</div>
</section>
