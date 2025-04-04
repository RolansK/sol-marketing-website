<script>
	import Header from './Header.svelte';
	import LogoBig from '$lib/icons/logo-big.svelte';
	import Grid from '$lib/icons/grid.svelte';
	import '../app.css';
	import Hamburger from '$lib/components/Hamburger.svelte';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		<Grid />
		<LogoBig />
		<Hamburger />
		{@render children()}
	</main>
</div>
