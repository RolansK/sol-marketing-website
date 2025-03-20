<script>
	const { title, className = '', url = '' } = $props();

	function handleClick(event) {
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

<button class={className} onclick={handleClick}>
	{title}
</button>
