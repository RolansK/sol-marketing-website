<script>
	import { page } from '$app/stores';
	import ButtonNav from '$lib/components/ButtonNav.svelte';
	import ButtonCta from '$lib/components/ButtonCta.svelte';

	import Play from '$lib/icons/play.svelte';
	import PuzzlePiece from '$lib/icons/puzzle-piece.svelte';
	import Star from '$lib/icons/star.svelte';
	import SealQuestion from '$lib/icons/seal-question.svelte';
	import Sparkle from '$lib/icons/sparkle.svelte';

	let { isOpen = false } = $props();
</script>

<nav class:open={isOpen}>
	<div class="mobile-mask"></div>
	<ButtonNav icon={Play} title="Demo" url="#demo" />
	<ButtonNav icon={PuzzlePiece} title="Components" url="#components" />
	<ButtonNav icon={Star} title="Features" url="#features" />
	<ButtonNav icon={SealQuestion} title="FAQ" url="#faq" />
	<ButtonCta
		icon={Sparkle}
		title="Get Sol"
		class="bottom"
		url="https://www.framer.com/marketplace/plugins/sol/"
	/>
</nav>
