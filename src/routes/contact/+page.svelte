<script>
	import Envelope from '$lib/assets/envelope.svelte';
	import Github from '$lib/assets/github-logo.svelte';
	import Instagram from '$lib/assets/instagram-logo.svelte';
	import Twitter from '$lib/assets/x-logo.svelte';

	let hoveredItem = $state(null);
	let isHovering = $state(false);

	async function copyEmail() {
		await navigator.clipboard.writeText('rolans@teyah.design');
		hoveredItem = 'copied';
		setTimeout(() => {
			hoveredItem = isHovering ? 'email' : null;
		}, 1000);
	}
</script>

<svelte:head>
	<title>Teyah | Contact</title>
	<meta name="description" content="Get in touch with Teyah through email or social media." />
</svelte:head>

<section>
	<div class="contact-grid">
		<span class={hoveredItem === 'copied' ? 'visible' : ''}>Copied!</span>
		<span class={hoveredItem === 'email' ? 'visible' : ''}>Copy email</span>
		<span class={hoveredItem === 'github' ? 'visible' : ''}>Github</span>
		<span class={hoveredItem === 'instagram' ? 'visible' : ''}>Instagram</span>
		<span class={hoveredItem === 'twitter' ? 'visible' : ''}>Twitter</span>
		<button
			tabindex="0"
			onmouseenter={() => {
				isHovering = true;
				hoveredItem = 'email';
			}}
			onmouseleave={() => {
				isHovering = false;
				hoveredItem = null;
			}}
			onclick={copyEmail}
		>
			<Envelope />
		</button>
		<button
			tabindex="0"
			onmouseenter={() => (hoveredItem = 'github')}
			onmouseleave={() => (hoveredItem = null)}
			onclick={() => window.open('https://github.com/teyah-design', '_blank')}
		>
			<Github />
		</button>
		<button
			tabindex="0"
			onmouseenter={() => (hoveredItem = 'instagram')}
			onmouseleave={() => (hoveredItem = null)}
			onclick={() => window.open('https://www.instagram.com/teyah_design/', '_blank')}
		>
			<Instagram />
		</button>
		<button
			tabindex="0"
			onmouseenter={() => (hoveredItem = 'twitter')}
			onmouseleave={() => (hoveredItem = null)}
			onclick={() => window.open('https://x.com/teyah_design', '_blank')}
		>
			<Twitter />
		</button>
	</div>
</section>
