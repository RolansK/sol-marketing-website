<script>
	import { page } from '$app/stores';
	import ButtonNav from '$lib/components/ButtonNav.svelte';
	import ButtonCta from '$lib/components/ButtonCta.svelte';

	import Play from '$lib/assets/play.svelte';
	import PuzzlePiece from '$lib/assets/puzzle-piece.svelte';
	import Star from '$lib/assets/star.svelte';
	import SealQuestion from '$lib/assets/seal-question.svelte';
	import Sparkle from '$lib/assets/sparkle.svelte';
</script>

<nav>
	<ButtonNav icon={Play} title="Demo" />
	<ButtonNav icon={PuzzlePiece} title="Components" />
	<ButtonNav icon={Star} title="Features" />
	<ButtonNav icon={SealQuestion} title="FAQ" />
	<ButtonCta icon={Sparkle} title="Get Sol" />
</nav>
