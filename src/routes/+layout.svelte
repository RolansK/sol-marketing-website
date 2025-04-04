<script>
	import Header from './Header.svelte';
	import LogoBig from '$lib/icons/logo-big.svelte';
	import Grid from '$lib/icons/grid.svelte';
	import '../app.css';
	import Hamburger from '$lib/components/Hamburger.svelte';
	import { onMount, onDestroy } from 'svelte';

	let { children } = $props();
	let isNavOpen = $state(false);

	function handleHamburgerClick(isOpen) {
		isNavOpen = isOpen;
	}

	function handleToggleNav(event) {
		isNavOpen = event.detail;
	}

	onMount(() => {
		document.addEventListener('togglenav', handleToggleNav);
	});

	onDestroy(() => {
		document.removeEventListener('togglenav', handleToggleNav);
	});
</script>

<div class="app">
	<Header isOpen={isNavOpen} />
	<main>
		<Grid />
		<LogoBig />
		<Hamburger hamburgerClick={handleHamburgerClick} isOpen={isNavOpen} />
		{@render children()}
	</main>
</div>
