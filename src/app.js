import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { Viewer } from './viewer.js';
import { SimpleDropzone } from 'simple-dropzone';
import { Validator } from './validator.js';
import { Footer } from './components/footer';
import '@albi_scando/as-design-system-lib/styles';
import * as DesignSystem from '@albi_scando/as-design-system-lib';
import queryString from 'query-string';
import { renderLanding } from './landing.js';

window.THREE = THREE;
window.VIEWER = {};

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	console.error('The File APIs are not fully supported in this browser.');
} else if (!WebGL.isWebGL2Available()) {
	console.error('WebGL is not supported in this browser.');
}

class App {
	/**
	 * @param  {Element} el
	 * @param  {Location} location
	 */
	constructor(el, location) {
		const hash = location.hash ? queryString.parse(location.hash) : {};
		this.options = {
			kiosk: Boolean(hash.kiosk),
			model: hash.model || '',
			preset: hash.preset || '',
			cameraPosition: hash.cameraPosition ? hash.cameraPosition.split(',').map(Number) : null,
		};
		this.location = location;

		this.el = el;
		this.viewer = null;
		this.viewerEl = null;
		this.spinnerEl = el.querySelector('.app-spinner');
		this.dropEl = el.querySelector('.dropzone');
		this.inputEl = el.querySelector('#file-input');
		this.validator = new Validator(el);

		this.createDropzone();
		if (this.spinnerEl) this.hideSpinner();

		const options = this.options;

		if (options.kiosk) {
			const headerEl = el.querySelector('header');
			if (headerEl) headerEl.style.display = 'none';
		}

		this.loadInitialModel();
	}

	/**
	 * Loads model from route pathname (/model-id) or #model=model-id.
	 */
	async loadInitialModel() {
		const routeModelId = this.getModelIdFromPath(this.location.pathname);
		const modelId = routeModelId || this.options.model;

		if (!modelId) return;

		try {
			this.showSpinner();
			const { url: modelURL, folderName } = await this.resolveModelURL(modelId);
			const rootPath = `/models/${folderName}/`;
			this.view(modelURL, rootPath, new Map());
		} catch (_error) {
			// Unknown model id — redirect to landing page
			window.location.href = '/';
		}
	}

	/**
	 * Returns model id from pathname: /model-id -> model-id.
	 * @param {string} pathname
	 * @return {string}
	 */
	getModelIdFromPath(pathname) {
		if (!pathname || pathname === '/') return '';

		const segment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
		if (!segment) return '';

		return decodeURIComponent(segment);
	}

	/**
	 * Resolves a loadable .glb/.gltf URL from /models/<model-id>/.
	 * @param {string} modelId
	 * @return {Promise<string>}
	 */
	async resolveModelURL(modelId) {
		if (!/^[a-zA-Z0-9_.\- ]+$/.test(modelId)) {
			throw new Error(`Invalid model id "${modelId}".`);
		}

		// Look up the actual folder name from the auto-generated manifest.
		// Manifest maps id -> "id - Name" folder, so /20260426 finds "20260426 - My Scene".
		let folderName = modelId;
		try {
			const res = await fetch('/models/manifest.json');
			if (res.ok) {
				const manifest = await res.json();
				const entry = manifest[modelId];
				if (entry) folderName = typeof entry === 'string' ? entry : (entry.folder ?? modelId);
			}
		} catch (_) {
			// manifest unavailable — fall back to exact folder name
		}

		const basePath = `/models/${folderName}`;
		const candidates = [
			`${basePath}/${modelId}.glb`,
			`${basePath}/${modelId}.gltf`,
			`${basePath}/scene.glb`,
			`${basePath}/scene.gltf`,
			`${basePath}/model.glb`,
			`${basePath}/model.gltf`,
		];

		for (const url of candidates) {
			if (await this.urlExists(url)) return { url, folderName };
		}

		throw new Error(`No .glb or .gltf found for model "${modelId}" in ${basePath}/.`);
	}

	/**
	 * Checks if URL is reachable.
	 * @param {string} url
	 * @return {Promise<boolean>}
	 */
	async urlExists(url) {
		const isModelResponse = (response) => {
			if (!response.ok) return false;
			const ct = response.headers.get('content-type') || '';
			// Reject if the server returned an HTML fallback page (SPA catch-all)
			return !ct.includes('text/html');
		};

		try {
			const response = await fetch(url, { method: 'HEAD' });
			if (isModelResponse(response)) return true;
			if (response.status !== 405) return false;
		} catch (_error) {
			return false;
		}

		try {
			const response = await fetch(url, { method: 'GET' });
			return isModelResponse(response);
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Sets up the drag-and-drop controller.
	 */
	createDropzone() {
		const dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
		dropCtrl.on('drop', ({ files }) => this.load(files));
		dropCtrl.on('dropstart', () => this.showSpinner());
		dropCtrl.on('droperror', () => this.hideSpinner());
	}

	/**
	 * Sets up the view manager.
	 * @return {Viewer}
	 */
	createViewer() {
		this.viewerEl = document.createElement('div');
		this.viewerEl.classList.add('viewer');
		this.dropEl.innerHTML = '';
		this.dropEl.appendChild(this.viewerEl);
		this.viewer = new Viewer(this.viewerEl, this.options);
		return this.viewer;
	}

	/**
	 * Loads a fileset provided by user action.
	 * @param  {Map<string, File>} fileMap
	 */
	load(fileMap) {
		let rootFile;
		let rootPath;
		Array.from(fileMap).forEach(([path, file]) => {
			if (file.name.match(/\.(gltf|glb)$/)) {
				rootFile = file;
				rootPath = path.replace(file.name, '');
			}
		});

		if (!rootFile) {
			this.onError('No .gltf or .glb asset found.');
		}

		this.view(rootFile, rootPath, fileMap);
	}

	/**
	 * Passes a model to the viewer, given file and resources.
	 * @param  {File|string} rootFile
	 * @param  {string} rootPath
	 * @param  {Map<string, File>} fileMap
	 */
	view(rootFile, rootPath, fileMap) {
		if (this.viewer) this.viewer.clear();

		const viewer = this.viewer || this.createViewer();

		const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);

		const cleanup = () => {
			// Add a delay to keep the spinner visible longer
			setTimeout(() => {
				this.hideSpinner();
				if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
			}, 500);
		};

		viewer
			.load(fileURL, rootPath, fileMap)
			.catch((e) => this.onError(e))
			.then((gltf) => {
				// TODO: GLTFLoader parsing can fail on invalid files. Ideally,
				// we could run the validator either way.
				if (!this.options.kiosk) {
					this.validator.validate(fileURL, rootPath, fileMap, gltf);
				}
				cleanup();
			});
	}

	/**
	 * @param  {Error} error
	 */
	onError(error) {
		let message = (error || {}).message || error.toString();
		if (message.match(/ProgressEvent/)) {
			message = 'Unable to retrieve this file. Check JS console and browser network tab.';
		} else if (message.match(/Unexpected token/)) {
			message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
		} else if (error && error.target && error.target instanceof Image) {
			message = 'Missing texture: ' + error.target.src.split('/').pop();
		}
		window.alert(message);
		console.error(error);
	}

	showSpinner() {
		if (this.spinnerEl) {
			this.spinnerEl.classList.add('spinner-visible');
			this.spinnerEl.removeAttribute('hidden');
		}
		const uploadBtn = this.el.querySelector('.upload-btn');
		if (uploadBtn) uploadBtn.classList.add('hidden-element');
	}

	hideSpinner() {
		if (this.spinnerEl) {
			this.spinnerEl.classList.remove('spinner-visible');
			this.spinnerEl.setAttribute('hidden', '');
		}
		const uploadBtn = this.el.querySelector('.upload-btn');
		if (uploadBtn) uploadBtn.classList.remove('hidden-element');
	}
}

document.addEventListener('DOMContentLoaded', async () => {
	const pathname = location.pathname;
	const segment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
	const isRoot = !segment;

	if (isRoot) {
		// Show landing page
		document.body.classList.add('landing-mode');
		document.getElementById('landing-view').removeAttribute('hidden');
		await renderLanding(document.getElementById('landing-cards'));
		return;
	}

	// Show viewer
	document.body.classList.add('viewer-mode');
	const viewerView = document.getElementById('viewer-view');
	viewerView.removeAttribute('hidden');

	// Inject three.js footer into viewer
	viewerView.querySelector('.wrap').insertAdjacentHTML('beforeend', Footer());

	// Back button → gallery
	document.getElementById('back-btn').addEventListener('click', () => {
		window.location.href = '/';
	});

	const app = new App(viewerView, location);
	window.VIEWER.app = app;
	console.info('[glTF Viewer] Debugging data exported as `window.VIEWER`.');
});
