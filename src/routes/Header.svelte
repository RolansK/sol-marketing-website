<script>
	import { page } from '$app/stores';
	import ButtonNav from '$lib/components/ButtonNav.svelte';
	import Play from '$lib/assets/play.svelte';
	import PuzzlePiece from '$lib/assets/puzzle-piece.svelte';
	import Star from '$lib/assets/star.svelte';
</script>

<nav>
	<ButtonNav icon={Play} title="Home" />
	<ButtonNav icon={PuzzlePiece} title="Contact" />
	<ButtonNav icon={Star} title="About" />
	<a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a>
	<a href="/contact" aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}
		>Contact</a
	>
	<a href="/about" aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>About</a>
</nav>
