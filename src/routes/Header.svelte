<script>
	import { page } from '$app/stores';
</script>

<nav>
	<a href="/" aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Home</a>
	<a href="/contact" aria-current={$page.url.pathname === '/contact' ? 'page' : undefined}
		>Contact</a
	>
	<a href="/about" aria-current={$page.url.pathname === '/about' ? 'page' : undefined}>About</a>
</nav>
