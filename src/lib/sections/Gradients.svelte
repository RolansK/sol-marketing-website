<script>
	import Slider from '$lib/components/Slider.svelte';

	let forceGraphContainer;
</script>

<section class="components nopadding">
	<Slider
		itemWidth={240}
		gap={0.25}
		padding={20}
		maxWidth={600}
		color1="#FF3E00"
		color2="#FF8700"
	/>

	<span>
		<h2>Create a shape.<br />Any shape</h2>
		<p>
			Rounded rectangles are cool, but there's a bit more you can make with shape generators -
			flowers, stars, droplets, blobs, squircles… You get it, the list goes on.
		</p>
	</span>
</section>
