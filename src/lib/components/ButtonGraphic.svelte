<script>
	import GPerlinWave from './GPerlinWave.svelte';

	let {
		text = 'Sol',
		href = '#',
		colors = [
			{ color: '#fae6e6', position: 0 },
			{ color: '#e03100', position: 0.35 },
			{ color: '#6e008a', position: 0.87 },
			{ color: '#0e0014', position: 1 }
		]
	} = $props();
</script>

<a {href} class="button-graphic" target="_blank" rel="noopener noreferrer">
	<span>{text}</span>
	<GPerlinWave width={80} height={80} {colors} />
</a>
