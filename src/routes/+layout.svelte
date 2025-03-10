<script>
	import Header from './Header.svelte';
	import LogoBig from '$lib/assets/logo-big.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<main>
		<LogoBig />
		{@render children()}
	</main>
</div>
