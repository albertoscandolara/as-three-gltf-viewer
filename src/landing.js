/**
 * Renders the landing page model cards into the given container element.
 * Uses ds-feature-card, ds-badge, and base-button from the design system.
 * @param {HTMLElement} container
 */
export async function renderLanding(container) {
	let manifest = {};
	try {
		const res = await fetch('/models/manifest.json');
		if (res.ok) manifest = await res.json();
	} catch (_) {}

	const modelIds = Object.keys(manifest);

	if (!modelIds.length) {
		container.innerHTML = '<p class="landing-empty">No models available yet. Add folders to <code>public/models/</code>.</p>';
		return;
	}

	for (const id of modelIds) {
		const entry = manifest[id];
		const folder = typeof entry === 'string' ? entry : (entry?.folder ?? id);
		const title = (typeof entry === 'object' && entry?.title) ? entry.title : id;
		const description = (typeof entry === 'object' && entry?.description) ? entry.description : '';
		const image = (typeof entry === 'object' && entry?.image) ? entry.image : '';
		const imageUrl = image ? `/models/${encodeURIComponent(folder)}/${image}` : '';
		const modelFileUrl = `/models/${encodeURIComponent(folder)}/scene.gltf`;

		const card = document.createElement('ds-feature-card');
		card.className = 'model-card';

		// Image slot
		if (imageUrl) {
			const img = document.createElement('img');
			img.slot = 'image';
			img.src = imageUrl;
			img.alt = title;
			card.appendChild(img);
		} else {
			const placeholder = document.createElement('div');
			placeholder.slot = 'image';
			placeholder.className = 'model-card__placeholder';
			placeholder.innerHTML = `<span class="model-card__id-label">${title.slice(0, 2).toUpperCase()}</span>`;
			card.appendChild(placeholder);
		}

		// Badges slot
		const badgeSlot = document.createElement('div');
		badgeSlot.slot = 'badges';
		const badge = document.createElement('ds-badge');
		badge.setAttribute('variant', 'primary');
		badge.textContent = id;
		badgeSlot.appendChild(badge);
		card.appendChild(badgeSlot);

		// Title
		const titleEl = document.createElement('h3');
		titleEl.className = 'model-card__title';
		titleEl.textContent = title;
		card.appendChild(titleEl);

		// Description
		if (description) {
			const descEl = document.createElement('p');
			descEl.className = 'model-card__desc';
			descEl.textContent = description;
			card.appendChild(descEl);
		}

		// Footer slot — View + Download buttons
		const footerSlot = document.createElement('div');
		footerSlot.slot = 'footer';
		footerSlot.className = 'model-card__footer';

		const viewBtn = document.createElement('base-button');
		viewBtn.setAttribute('title', 'Open in 3D viewer');
		viewBtn.textContent = 'View Model';
		viewBtn.addEventListener('click', () => {
			window.location.href = `/${id}`;
		});

		const dlBtn = document.createElement('base-button');
		dlBtn.setAttribute('title', 'Download model file');
		dlBtn.textContent = 'Download';
		dlBtn.addEventListener('click', () => {
			const a = document.createElement('a');
			a.href = modelFileUrl;
			a.download = `${title}.gltf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		});

		footerSlot.appendChild(viewBtn);
		footerSlot.appendChild(dlBtn);
		card.appendChild(footerSlot);

		container.appendChild(card);
	}
}
