import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Scans public/models/ and writes public/models/manifest.json mapping
 * id -> folder name, where id is the part before the first " - ".
 * e.g.  "20260426 - My Scene"  ->  { "20260426": "20260426 - My Scene" }
 */
function modelManifestPlugin() {
	const modelsDir = path.resolve(__dirname, 'public/models');
	const manifestPath = path.resolve(modelsDir, 'manifest.json');

	function buildManifest() {
		if (!fs.existsSync(modelsDir)) return;
		const entries = fs.readdirSync(modelsDir, { withFileTypes: true });
		const manifest = {};
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const folderName = entry.name;
			const id = folderName.split(' - ')[0].trim();
			const defaultTitle = folderName.split(' - ').slice(1).join(' - ').trim() || folderName;

			let meta = { title: defaultTitle, description: '', image: '' };
			const metaPath = path.join(modelsDir, folderName, 'meta.json');
			if (fs.existsSync(metaPath)) {
				try {
					const fileMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
					meta = { ...meta, ...fileMeta };
				} catch (_) {}
			}

			manifest[id] = { folder: folderName, ...meta };
		}
		fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	}

	return {
		name: 'model-manifest',
		buildStart() {
			buildManifest();
		},
		configureServer(server) {
			buildManifest();
			server.watcher.add(modelsDir);
			server.watcher.on('addDir', buildManifest);
			server.watcher.on('unlinkDir', buildManifest);
		},
	};
}

export default defineConfig({
	publicDir: 'public',
	plugins: [modelManifestPlugin()],
	server: {
		fs: {
			strict: false,
		},
	},
});
