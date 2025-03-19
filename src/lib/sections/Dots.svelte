<script>
	import DotGrid from '$lib/components/webgl/DotGrid.svelte';
</script>

<section class="components nopadding">
	<span class="left">
		<h2>Woah, what<br />is that?</h2>
		<p>
			Hover and see what happens. Yes, the dots react to mouse hover. Yes, you just tap and drag on
			mobile. Yes, it does feel quite satisfying.
		</p>
	</span>

	<div class="container">
		<div>
			<DotGrid width="100%" height="100%" />
		</div>
	</div>
</section>
