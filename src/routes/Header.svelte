<script>
	import { page } from '$app/stores';
	import ButtonNav from '$lib/components/ButtonNav.svelte';
	import ButtonCta from '$lib/components/ButtonCta.svelte';
	import Hamburger from '$lib/components/Hamburger.svelte';

	import Play from '$lib/icons/play.svelte';
	import PuzzlePiece from '$lib/icons/puzzle-piece.svelte';
	import Star from '$lib/icons/star.svelte';
	import SealQuestion from '$lib/icons/seal-question.svelte';
	import Sparkle from '$lib/icons/sparkle.svelte';

	let { isOpen = false, closeNav } = $props();

	function toggleMenu() {
		if (isOpen) {
			closeNav();
		} else {
			isOpen = true;
		}
	}
</script>

<Hamburger hamburgerClick={toggleMenu} {isOpen} />

<nav class:open={isOpen}>
	<div class="mobile-mask"></div>
	<ButtonNav icon={Play} title="Demo" url="#demo" onclick={closeNav} />
	<ButtonNav icon={PuzzlePiece} title="Components" url="#components" onclick={closeNav} />
	<ButtonNav icon={Star} title="Features" url="#features" onclick={closeNav} />
	<ButtonNav icon={SealQuestion} title="FAQ" url="#faq" onclick={closeNav} />
	<ButtonCta
		icon={Sparkle}
		title="Get Sol"
		class="bottom"
		url="https://www.framer.com/marketplace/plugins/sol/"
		onclick={closeNav}
	/>
</nav>
