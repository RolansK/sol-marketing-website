<script>
	import Button from '$lib/components/Button.svelte';
	import Eye from '$lib/icons/eye.svelte';
</script>

<section class="hero">
	<div>
		<img src="/src/lib/pictures/hero005.jpg" alt="Hero 5" />
		<img src="/src/lib/pictures/hero004.jpg" alt="Hero 4" />
		<img src="/src/lib/pictures/hero003.jpg" alt="Hero 3" />
		<img src="/src/lib/pictures/hero002.jpg" alt="Hero 2" />
		<img src="/src/lib/pictures/hero001.jpg" alt="Hero 1" />
		<span>Loved by pros</span>
		<h1>Visual</h1>
		<Eye />
		<h1>&nbsp;plugin</h1>
		<h1>for Framer</h1>

		<Button title="Watch the demo" className="button-primary" />
		<Button title="Follow on X" className="button-secondary" />
	</div>
</section>
