<script>
	import { page } from '$app/stores';
	import TeyahLogo from '$lib/assets/teyah-logo-full.svelte';
</script>

<nav>
	<TeyahLogo />
	<div class="nav-links">
		<a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a>
		<a href="/contact" aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}
			>Contact</a
		>
		<a href="/about" aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>About</a>
	</div>
</nav>
