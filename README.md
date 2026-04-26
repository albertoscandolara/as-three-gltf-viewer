# Alberto Scandolara — 3D Model Viewer

> A modern, interactive 3D model viewer built with **three.js**, **Vite**, and **Web Components**. Features a landing page gallery, URL-based routing and real-time model loading.

## ✨ Features

- **🎨 Modern Landing Page** — Vibrant card-based gallery with model preview images
- **🔗 URL-Based Routing** — Access models directly via `/model-id` (e.g., `/20210625` → Allosaurus)
- **🎯 Interactive 3D Viewer** — Real-time WebGL rendering with material editing and animation controls
- **📄 Model Metadata** — Customize title, description, and thumbnail image per model
- **⚡ Auto-Generated Manifest** — Vite plugin automatically discovers and indexes models
- **📦 Design System Integration** — Clean UI built with custom Web Components
- **📱 Responsive Design** — Works on desktop and tablet

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
.
├── public/
│   ├── models/                      # 3D model files
│   │   ├── 20210625 - Allosaurus/
│   │   │   ├── scene.gltf           # Main model file
│   │   │   ├── scene.bin            # Binary geometry data
│   │   │   ├── meta.json            # Model metadata
│   │   │   └── thumbnail.jpg        # Card preview image
│   │   ├── manifest.json            # Auto-generated index (created by Vite plugin)
│   │   └── ...
│   └── favicon.ico
├── src/
│   ├── app.js                       # Main app controller
│   ├── landing.js                   # Landing page gallery renderer
│   ├── viewer.js                    # 3D viewer implementation
│   ├── validator.js                 # glTF validation
│   └── components/
│       └── footer.js                # Footer component
├── style.css                        # Application styling
├── index.html                       # SPA entry point
├── vite.config.js                   # Build config with model manifest plugin
├── package.json
└── README.md
```

## 🔗 Route-Based Model Loading

Models are accessed via URL path:

```
/                           → Landing page with gallery
/20210625                  → Load Allosaurus model
/20210626                  → Load Stegosaurus model
```

### Model Folder Convention

```
public/models/<model-id>/
```

**Supported model filename patterns** (checked in this order):
- `<model-id>.glb`
- `<model-id>.gltf`
- `scene.glb`
- `scene.gltf`
- `model.glb`
- `model.gltf`

### Invalid Model IDs

Accessing an invalid model ID (e.g., `/invalid-model`) automatically redirects to `/` (landing page).

## 📝 Model Metadata

Customize each model's appearance on the landing page by adding a `meta.json` file:

```json
{
  "title": "Allosaurus",
  "description": "An Allosaurus dinosaur 3D model created using basic geometries in Blender.",
  "image": "thumbnail.jpg"
}
```

**Files in `public/models/<model-id>/`:**
- `meta.json` — Model metadata (optional, model ID used as fallback)
- `thumbnail.jpg` — Preview image for gallery card (optional, placeholder generated if missing)
- `scene.gltf` + `scene.bin` — glTF model files

## 🛠️ Build & Deployment

### Development

```bash
npm run dev     # Start dev server on port 3000
```

### Production Build

```bash
npm run build   # Create optimized build in ./dist
```

### Deploy to Vercel

The project includes a `vercel.json` SPA rewrite configuration. All routes are served `index.html` for client-side routing.

```bash
npm run deploy  # Build and deploy to Vercel (requires vercel CLI)
```

## 🎮 UI Features

### Landing Page
- Card-based model gallery with hover effects
- "View Model" button → Navigate to 3D viewer
- "Download" button → Download model as `.gltf`
- Responsive grid layout
- Dark theme with vibrant gradients

### 3D Viewer
- **Controls**
  - Left-click drag → Rotate model
  - Right-click drag (or Ctrl+click) → Pan camera
  - Scroll wheel → Zoom
  - Double-click → Reset view

- **Settings Panel**
  - Background color
  - Environment lighting
  - Auto-rotation toggle
  - Wireframe mode
  - Skeleton visualization
  - Grid display
  - And more...

- **Loading** — Spinner appears during model load

- **Back Button** — Return to landing page

## 💾 Manifest Auto-Generation

The `vite.config.js` includes a custom plugin that:
1. Scans `public/models/` at dev start and build time
2. Reads folder names and optional `meta.json` files
3. Generates `public/models/manifest.json`
4. Watches for folder additions/removals

No manual indexing needed — just add folders and reload!

## 📦 Technologies

- **[three.js r176](https://threejs.org/)** — WebGL 3D graphics
- **[Vite 5](https://vitejs.dev/)** — Build tool & dev server
- **[@albi_scando/as-design-system-lib](https://www.npmjs.com/package/@albi_scando/as-design-system-lib)** — Web Components
- **[simple-dropzone](https://www.npmjs.com/package/simple-dropzone)** — Drag-and-drop
- **[gltf-validator](https://www.npmjs.com/package/gltf-validator)** — glTF 2.0 validation
- **[dat.GUI](https://github.com/dataarts/dat.gui)** — Viewer settings panel
- **Modern CSS** — Gradients, animations, glass-morphism effects

## 🎓 glTF 2.0 Resources

- [THREE.GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [glTF 2.0 Specification](https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/)
- [Khronos glTF Validators](https://www.khronos.org/gltf/)

## ⚙️ Development Notes

### Adding a New Model

1. Create folder: `public/models/<model-id>/`
2. Add model file (one of: `<model-id>.glb`, `scene.gltf`, etc.)
3. (Optional) Add `meta.json` with title, description, image
4. (Optional) Add thumbnail image (e.g., `thumbnail.jpg`)
5. Reload dev server — manifest auto-generates

### Styling

Main stylesheet: `style.css`
- Landing page styling
- 3D viewer layout
- Spinner animations
- Dark theme with purple/indigo accent colors
- Glass-morphism effects

## 🙏 Credits

- Original three-gltf-viewer by [Don McCurdy](https://www.donmccurdy.com/)
- three.js by Khronos Group
- Design system components by @albi_scando
