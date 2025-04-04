<script>
	import Check from '$lib/icons/check.svelte';
	import Envelope from '$lib/icons/envelope.svelte';
	import Faq from '$lib/components/Faq.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<section id="faq" class="features-container">
	<div class="pricing-card">
		<h1>Pricing</h1>
		<span>
			<h2>39€</h2>
			/lifetime
		</span>
		<div class="pricing-divider"></div>
		<li><Check />All current components;</li>
		<li><Check />All future updates;</li>
		<li><Check />Priority email support;</li>
		<li><Check />Unlimited use in personal and client projects;</li>
		<li><Envelope />Contact for use in templates.</li>
		<Button
			title="Get Sol"
			className="button-cta"
			url="https://www.framer.com/marketplace/plugins/sol/"
		/>
	</div>
	<Faq />
</section>
