<script>
	import ButtonPrimary from '$lib/components/ButtonPrimary.svelte';
	import Eye from '$lib/icons/eye.svelte';
</script>

<section class="hero">
	<div>
		<img class="hero-image" src="/src/lib/pictures/hero005.jpg" alt="Hero 5" />
		<img class="hero-image" src="/src/lib/pictures/hero004.jpg" alt="Hero 4" />
		<img class="hero-image" src="/src/lib/pictures/hero003.jpg" alt="Hero 3" />
		<img class="hero-image" src="/src/lib/pictures/hero002.jpg" alt="Hero 2" />
		<img class="hero-image" src="/src/lib/pictures/hero001.jpg" alt="Hero 1" />
		<span>Loved by pros</span>
		<span>Visual</span>
		<Eye />
		<span>plugin</span>
		<span>for Framer</span>

		<ButtonPrimary title="Watch the demo" />
		<ButtonPrimary title="Follow on X" />
	</div>
</section>
