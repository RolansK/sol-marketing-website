<script>
	import Plus from '$lib/icons/plus.svelte';

	const faqs = [
		{
			question: 'How do I request a feature?',
			answer:
				'Use the contact form in the plugin settings or simply <a href="mailto:support@teyah.design" target="_blank" rel="noopener">email us.</a>'
		},
		{
			question: 'How do I report a bug?',
			answer:
				'Same as requesting a feature - use the contact form in the plugin settings or simply <a href="mailto:support@teyah.design" target="_blank" rel="noopener">email us.</a>'
		},
		{
			question: 'How fast do you reply to emails?',
			answer: 'Typically, within 48 hours or less.'
		},
		{
			question: 'Can I use Sol in my Framer template?',
			answer:
				'If you are planning to use it in templates, please <a href="mailto:support@teyah.design" target="_blank" rel="noopener">email us.</a> Use in templates without our permission is not allowed.'
		},
		{
			question: 'Are animations gifs or videos?',
			answer:
				'Neither, actually! Everything is a code snippet that browser renders real-time. In practice, it means super tiny size and fast performance.'
		},
		{
			question: 'Can I get notified about updates?',
			answer:
				'Yes! We will let you know via email once a new update is out. You can also check our <a href="https://x.com/teyah_design" target="_blank" rel="noopener">X/Twitter</a> account.'
		}
	];

	let activeIndices = $state([]);

	function toggleFaq(index) {
		activeIndices = activeIndices.includes(index)
			? activeIndices.filter((i) => i !== index)
			: [...activeIndices, index];
	}
</script>

<div class="faq-container">
	<h1>FAQ</h1>
	{#each faqs as faq, i}
		<div class="faq-item">
			<button
				class="faq-question"
				class:active={activeIndices.includes(i)}
				onclick={() => toggleFaq(i)}
			>
				<span class={activeIndices.includes(i) ? 'rotated' : ''}><Plus /></span>
				<h3>{@html faq.question}</h3>
			</button>
			<div class="faq-answer {activeIndices.includes(i) ? 'active' : ''}">
				<p>{@html faq.answer}</p>
			</div>
		</div>
	{/each}
</div>
