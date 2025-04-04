<script>
	import Button from '$lib/components/Button.svelte';
	import Eye from '$lib/icons/eye.svelte';
	import hero001 from '$lib/pictures/hero001.jpg';
	import hero002 from '$lib/pictures/hero002.jpg';
	import hero003 from '$lib/pictures/hero003.jpg';
	import hero004 from '$lib/pictures/hero004.jpg';
	import hero005 from '$lib/pictures/hero005.jpg';
</script>

<section class="hero">
	<div>
		<img src={hero005} alt="Hero 5" />
		<img src={hero004} alt="Hero 4" />
		<img src={hero003} alt="Hero 3" />
		<img src={hero002} alt="Hero 2" />
		<img src={hero001} alt="Hero 1" />
		<span>Loved by pros</span>
		<h1>Visual</h1>
		<Eye />
		<h1>&nbsp;plugin</h1>
		<h1>for Framer</h1>

		<Button title="Watch the demo" className="button-cta" url="#demo" />
		<Button title="Follow on X" className="button-secondary" url="https://x.com/teyah_design" />
	</div>
</section>
