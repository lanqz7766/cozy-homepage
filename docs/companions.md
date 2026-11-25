# Companion source / 动物源码

Four original procedural animals share a workstation and gentle typing animation. No downloaded character mesh or Blender installation is required. The bear originated as the ClinAgent mascot for Qizhen Lan's homepage; the template uses generic screen lettering.

## Choose an animal / 选择动物

Set `data-companion="bear"`, `"cat"`, `"bunny"`, or `"panda"` on `#companion-station` in `index.html`. Also update the initial `.poster` image to `assets/scenes/ANIMAL-poster.png`, its `alt`, and the figure/canvas accessibility labels. This keeps the correct animal visible before JavaScript loads. Remove the `.companion-picker` element to hide switching; rotation still works.

在 HTML 中设置默认动物，同时修改初始后备图片及替代文字。删除切换栏后仍然支持拖动和键盘旋转。

## Rebuild / 重新生成

```sh
npm ci
npm run build:models
# Or rebuild one animal:
node tools/build-companion.mjs cat
```

The only development dependency is Three.js 0.169.0. The generator uses GLTFExporter and a Node FileReader shim. Each GLB includes the `Alternating keystrokes` animation.

| Source | Purpose |
| --- | --- |
| `tools/build-companion.mjs`: `m` and species palettes | Colors and materials |
| `softBlock`, `sculpt`, `block` | Clean chamfers, stepped silhouettes and simple blocks |
| `makeCompanionHead` | Cat, bunny and panda heads |
| `makeBear` | Shared body, paws, typing tracks and original bear head |
| `makeChair`, `makeTerminal` | Furniture and workstation |
| `src/companions.js` | Animal names, GLB paths and matching posters |
| `src/station.js` | Loading, camera, lighting, rotation and animation lifecycle |

Keep broad facial surfaces clean. Avoid adding nested stepped layers around the eyes and muzzle. New GLBs should match the existing scale, camera target and first-animation convention; unrelated assets may need viewer adjustments.

## Export matching posters / 导出后备图

1. Run `npm run dev` and open `http://127.0.0.1:8040/tools/scene-studio.html`.
2. Choose an animal and keep the default angle.
3. Click **Export transparent PNG**, then **Download PNG**.
4. Replace `assets/scenes/ANIMAL-poster.png` with the downloaded image.
5. Run `npm run check` and inspect the homepage.

The studio pauses typing and renders a transparent PNG at the viewer's actual lighting and camera. It is a development tool and is not included in `dist/`.

GLB regeneration does not update PNG posters automatically. 每次修改模型外观后，请重新导出该动物的 PNG，保证加载前后形象一致。
