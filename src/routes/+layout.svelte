<script>
	import Header from './Header.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="app">
	<Header />
	<div class="gradient-line"></div>

	<main>
		{@render children()}
	</main>
</div>
