<script>
	const { icon, title = 'Demo', url = '', onclick = null } = $props();

	function handleClick(event) {
		if (onclick) {
			onclick(event);
		}

		if (url) {
			if (url.startsWith('#')) {
				event.preventDefault();

				const targetId = url.substring(1);
				const element = document.getElementById(targetId);

				if (element) {
					element.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});

					history.pushState(null, null, url);
				}
			} else {
				window.open(url, '_blank', 'noopener,noreferrer');
			}
		}
	}
</script>

<button class="button-nav" onclick={handleClick}>
	{#if icon}
		{@const Icon = icon}
		<Icon class="icon" />
	{/if}
	<span>{title}</span>
</button>
