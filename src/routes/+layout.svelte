<script>
	import Header from './Header.svelte';
	import LogoBig from '$lib/icons/logo-big.svelte';
	import Grid from '$lib/icons/grid.svelte';
	import '../app.css';
	import Hamburger from '$lib/components/Hamburger.svelte';

	let { children } = $props();
	let isNavOpen = $state(false);

	function handleHamburgerClick(isOpen) {
		isNavOpen = isOpen;
	}
</script>

<div class="app">
	<Header isOpen={isNavOpen} />
	<main>
		<Grid />
		<LogoBig />
		<Hamburger hamburgerClick={handleHamburgerClick} />
		{@render children()}
	</main>
</div>
