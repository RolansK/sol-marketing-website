<script>
	import { page } from '$app/stores';
	import TeyahLogo from '$lib/assets/teyah-logo-full.svelte';
</script>

<nav>
	<TeyahLogo />
	<p>
		A small studio building design tools for curious creatives with care and love. Based in the
		Netherlands.
	</p>
	<div class="nav-links">
		<a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a>
		<a href="/contact" aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}
			>Contact</a
		>
		<a href="/about" aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>About</a>
	</div>
</nav>
