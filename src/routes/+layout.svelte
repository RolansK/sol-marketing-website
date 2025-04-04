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

	function closeNav() {
		isNavOpen = false;
	}
</script>

<div class="app">
	<Header isOpen={isNavOpen} {closeNav} />
	<main>
		<Grid />
		<LogoBig />
		<Hamburger hamburgerClick={handleHamburgerClick} isOpen={isNavOpen} />
		{@render children()}
	</main>
</div>
