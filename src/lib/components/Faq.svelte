<script>
	import Plus from '$lib/icons/plus.svelte';

	const faqs = [
		{
			question: 'How do I request a feature?',
			answer: 'Use the contact form in the plugin settings or simply email us.'
		},
		{
			question: 'How do I report a bug?',
			answer:
				'Same as requesting a feature - use the contact form in the plugin settings or simply email us.'
		},
		{
			question: 'How fast do you reply to emails?',
			answer: 'Typically, within 48 hours or less.'
		},
		{
			question: 'Can I use Sol in my Framer template?',
			answer:
				'If you are planning to use it in templates, please email us. Use in templates without our permission is not allowed.'
		},
		{
			question: 'Are animations gifs or videos?',
			answer:
				'Neither, actually! Everything is a code snippet that browser renders real-time. In practice, it means super tiny size and fast performance.'
		},
		{
			question: 'Can I get notified about updates?',
			answer:
				'Yes! We will let you know via email once a new update is out. You can also check our X/Twitter account.'
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
				<h3>{faq.question}</h3>
			</button>
			<div class="faq-answer {activeIndices.includes(i) ? 'active' : ''}">
				<p>{faq.answer}</p>
			</div>
		</div>
	{/each}
</div>
