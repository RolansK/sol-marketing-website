<script>
	import Header from './Header.svelte';
	import LogoBig from '$lib/assets/logo-big.svelte';
	import Grid from '$lib/assets/grid.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		<Grid />
		<LogoBig />
		{@render children()}
	</main>
</div>
