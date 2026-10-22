# dsh-live2d-pet

> **Canonical home / 正式仓库：** [`lizekun793-beep/dsh-plugins`](https://github.com/lizekun793-beep/dsh-plugins/tree/main/dsh-live2d-pet)（本目录）。独立仓库 [`dsh-live2d-pet`](https://github.com/lizekun793-beep/dsh-live2d-pet) 仍作镜像。


> **Modified fork / 魔改分支** of [`ankesu/dsh-live2d-pet`](https://github.com/ankesu/dsh-live2d-pet) (`feat/tororo`).
>
> Original author / 原作者: [ankesu](https://github.com/ankesu) — MIT License (see [`LICENSE`](./LICENSE)).
> Additional modifications / 额外改动: [lizekun793-beep](https://github.com/lizekun793-beep).
>
> A Live2D companion pet for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — renders a Cubism model as a floating companion in the Web UI, with state-driven expressions, mouse tracking, drag repositioning, and a settings panel.
>
> DSH 桌宠 Live2D 插件：在 Web UI 里渲染一个 Cubism 模型作为浮动桌宠，支持状态联动表情、鼠标跟随、拖拽摆位、设置页开关与配置。

## Attribution & changes / 来源与改动说明

This repository is a derivative of
[ankesu/dsh-live2d-pet](https://github.com/ankesu/dsh-live2d-pet) (branch
[`feat/tororo`](https://github.com/ankesu/dsh-live2d-pet/tree/feat/tororo)).
The upstream MIT copyright notice is retained in [`LICENSE`](./LICENSE).

本仓库基于 [ankesu/dsh-live2d-pet](https://github.com/ankesu/dsh-live2d-pet)
的 [`feat/tororo`](https://github.com/ankesu/dsh-live2d-pet/tree/feat/tororo)
分支魔改；保留上游 MIT 版权声明（见 [`LICENSE`](./LICENSE)）。

**Changes in this fork / 本 fork 主要改动（0.1.3-local）：**

- **Settings panel / 设置页**：控制改到 Settings →「Live2D 宠物」（开关、模型、大小、偏移、空闲间隔、状态动作），写入 `$DSH_HOME/dsh-live2d-pet/config.json`；已移除顶栏 ✨ 按钮。
- **Richer Tororo motions / 白猫动作**：接上原样例 Flick / FlickUp / FlickDown，并新增 Think / Happy / Stretch / Sleepy / Curious 短动作，供状态联动与空闲小动作使用。
- **Cubism core boot fix / Cubism 启动修复**：桌面 Electron 启动时通过 `webserver/index-inject`（`script-src`）注入 `live2dcubismcore.min.js`，并在 client banner 里加同步 XHR 兜底，避免缺 `Live2DCubismCore` 导致插件崩溃。

**Bundled Live2D sample models / 附带样例模型：** Haru / Tororo / Hijiki are © Live2D Inc., distributed under the official Live2D sample-model license for testing and demonstration — replace them for production use.

附带 Haru / Tororo / Hijiki 样例模型 © Live2D Inc.，按官方样例模型许可仅供测试演示——生产环境请替换为自己的模型。

## Table of Contents / 目录

- [Attribution & changes / 来源与改动说明](#attribution--changes--来源与改动说明)
- [Features / 功能](#features--功能)
- [Cat pets (branch) / 猫宠物（分支）](#cat-pets--猫宠物分支)
- [Install / 安装](#install--安装)
- [Enable / 启用（必读）](#enable--启用必读)
- [Configuration / 配置](#configuration--配置)
- [State → Expression map / 状态表情映射](#state--expression-map--状态表情映射)
- [Debug handles / 调试句柄](#debug-handles--调试句柄)
- [Bring your own model / 换自己的模型](#bring-your-own-model--换自己的模型)
- [Architecture & pitfalls / 架构与排雷](#architecture--pitfalls--架构与排雷)
- [Development / 开发](#development--开发)
- [License / 许可](#license--许可)

---

## Features / 功能

| | English | 中文 |
|---|---|---|
| 🐳 **Real Live2D** | Powered by [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) (Cubism 4), rendered on a transparent floating canvas | 基于 pixi-live2d-display（Cubism 4）渲染，透明浮动画布 |
| 👀 **Mouse tracking** | Head turns and gaze follow your cursor (`ParamAngleX/Y`, `ParamEyeBallX/Y`); the iris is written every frame so expression snapshots can't clobber it | 头部与视线跟随鼠标；瞳孔每帧写入，表情快照覆盖不了 |
| 😊 **State-driven expressions** | The model's `.exp3.json` expressions map to harness activity states (`idle/waiting/thinking/tool/done/failed/sleep/…`) plus hover & drag | 表情按 AI 活动状态切换（idle/waiting/thinking/tool/done/failed/sleep…）+ hover/拖拽反馈 |
| 🎬 **Idle motion + fidgets** | The model's idle motion runs constantly; random tap motions play as idle micro-antics | 常驻待机动作；空闲时随机播小动作（发呆/挠头） |
| 🎛️ **Config-driven geometry** | Size / position / offsets come from `cordis.patch.yml` — tweak without rebuilding | 大小/位置/偏移全在 `cordis.patch.yml` 配置，改配置不用重编译 |
| 🖱️ **Drag repositioning** | Drag the pet anywhere; the offset persists in `localStorage` (with a viewport sanity-clamp against off-screen bugs) | 可拖拽到任意位置，偏移持久化（带防怼出屏幕的钳制） |
| 💾 **Settings & persistence** | Enable/configure under Settings →「Live2D 宠物」; overrides persist in `$DSH_HOME/dsh-live2d-pet/config.json` (localStorage still mirrored) | 在设置 →「Live2D 宠物」启用/配置；覆盖写入 `$DSH_HOME/dsh-live2d-pet/config.json`（仍同步 localStorage） |
| 🔗 **Session state linkage** | Watches the DSH conversation session — deep thinking / sleep / celebrate are time-driven | 监听 DSH 会话——深思考 / 睡觉 / 庆祝等按时间驱动 |

Enable the pet from **Settings →「Live2D 宠物」** (or PUT `/pet/live2d/user-config`). The header ✨ toggle from upstream is removed in this fork.

在本 fork 中请到 **设置 →「Live2D 宠物」** 启用（或 PUT `/pet/live2d/user-config`）；上游顶栏 ✨ 按钮已移除。

---

## Install / 安装

**Canonical (monorepo) / 正式安装（系列 monorepo）** — Tororo + settings panel + Cubism desktop boot fix.

```bash
# CLI（推荐；Manager 图形界面装 Git 源常报「无法从依赖变更中确定安装了哪一个包」）
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-live2d-pet" --registry=https://registry.npmmirror.com
```

Package name for `dsh.profile.bundles` / bundles 包名：`dsh-live2d-pet`.

Standalone mirror (legacy) / 独立仓库（备用）：
[`lizekun793-beep/dsh-live2d-pet`](https://github.com/lizekun793-beep/dsh-live2d-pet)

```bash
dsh plugin --profile <name> add "github:lizekun793-beep/dsh-live2d-pet#main"
```

- Profile name is often `web` on a cloud/server install, or `desktop` locally — use yours.
- 云服务器上 profile 多为 `web`，本机桌面多为 `desktop`，按实际名字替换。
- After install: restart the profile, hard-refresh, then **Settings →「Live2D 宠物」** → enable → Save.
- 装完后重启该 profile、硬刷新，再到 **设置 →「Live2D 宠物」** 启用并保存。

### Notes / 注意事项

1. **Manager GUI** — adding a raw `git+https://…` URL in the plugin UI often fails with「无法从依赖变更中确定安装了哪一个包」even when the package installed. Prefer the `dsh plugin … add` CLI above, then `dsh plugin --profile <name> list` to confirm `dsh-live2d-pet` is present.
   Manager 用 Git URL 点装时容易误报失败；优先用上面的 CLI，再用 `list` 确认。
2. **pnpm allowBuilds** — if you see `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`, add the exact line it prints to that profile’s `pnpm-workspace.yaml` under `allowBuilds:`, then re-run add.
   若 prepare 被拦，把报错打印的那一行加进 `allowBuilds:` 后重装。
3. **Proxy** — GitHub fetches on some servers need `HTTP_PROXY`/`HTTPS_PROXY` (or npm proxy). 云主机拉 GitHub 卡住时配代理。

### Upstream (ankesu) alternatives / 上游原作者安装方式

If you want the unmodified upstream packages instead of this fork:

若要装**未魔改**的上游包（不是本仓库）：

```bash
# npm Haru
dsh plugin --profile <name> add dsh-live2d-pet

# upstream white cat / 上游白猫
pnpm add "git+https://github.com/ankesu/dsh-live2d-pet.git#feat/tororo"

# upstream black cat / 上游黑猫
pnpm add "git+https://github.com/ankesu/dsh-live2d-pet.git#feat/hijiki"
```

---

## Enable / 启用（必读）

> ⚠️ **The model does NOT appear automatically after install.** Open
> **Settings →「Live2D 宠物」**, turn it on, and Save — or enable via user-config /
> localStorage as below.
> ⚠️ **装完不会自动显示！** 打开 **设置 →「Live2D 宠物」** 打开开关并保存；或用下面的
> user-config / localStorage 方式启用：

```js
localStorage.setItem('dsh-live2d-pet', '1')
```

1. Open the DSH web page (the profile where you installed the plugin)
2. Press `F12` → Console tab
3. Paste `localStorage.setItem('dsh-live2d-pet', '1')` and press Enter
4. Reload the page (`F5`)

The pet then floats at the bottom-right corner by default. The setting persists
across refreshes and server restarts — you only do this once per browser.

启用后宠物默认出现在右下角。设置跨刷新和重启保留，每个浏览器只需设置一次。

To disable / 关闭：

```js
localStorage.setItem('dsh-live2d-pet', '0')
```

---

## Configuration / 配置

`cordis.patch.yml` (in the plugin package):

```yaml
- insert:
    - id: live2d-pet
      name: dsh-live2d-pet
      config:
        model: haru/haru_greeter_t03.model3.json  # path under assets/live2d/
        size: 320                                  # canvas size, px
        right: 24                                  # distance from right edge, px
        bottom: 100                                # distance from bottom edge, px
        offsetX: 0                                 # extra horizontal shift, px
        offsetY: 0                                 # extra vertical shift, px
```

| Key | Meaning / 含义 | Default / 默认 |
|---|---|---|
| `model` | Path to the `.model3.json` under `assets/live2d/` | `haru/haru_greeter_t03.model3.json` |
| `size` | Canvas size in px (the model is scaled to fit by height) | `320` |
| `right` | Distance from the right edge (px) | `24` |
| `bottom` | Distance from the bottom edge (px) | `100` |
| `offsetX` / `offsetY` | Fine-tune from that corner (see note) | `0` |

> Default position is bottom-right using `right` / `bottom` (defaults `24` / `100`).
> Positive `offsetX` moves the pet leftward (decreases `right`); positive `offsetY`
> moves it upward (increases `bottom`). Drag still works; the drag offset is
> session-only and is wiped each boot.

> 默认用 `right` / `bottom`（默认 `24` / `100`）钉在右下角。正的 `offsetX` 往左移
> （减小 `right`），正的 `offsetY` 往上移（增大 `bottom`）。仍可拖拽；拖拽偏移仅当次会话有效，每次启动清零。

---

## State → Expression map / 状态表情映射

The bundled **Haru** sample model ships expressions `f00..f08`. The default
mapping (edit `PHASE_EXPRESSION` in `src/client/index.ts` to customize):

附带模型 Haru 提供表情 `f00..f08`。默认映射如下（改 `src/client/index.ts` 的
`PHASE_EXPRESSION` 可自定义）：

| State / 状态 | Expression / 表情 | Meaning / 含义 |
|---|---|---|
| `idle` | `f00` | neutral / 中性 |
| `waiting` | `f01` | expectant, mouth slightly open / 等待，微张嘴 |
| `thinking` | `f02` | concentrating, brows knit / 思考，皱眉 |
| `deep` (thinking > 5s) | `f02` | same concentration face / 深思考同款 |
| `tool` (a tool is running) | `f03` | working, grin / 干活，咧嘴 |
| `done` (turn finished) | `f04` | happy squint / 完成，眯眼笑 |
| `celebrate` (done + ≥3 tools) | `f04` | happy / 庆祝同款 |
| `failed` | `f00` | sample set has no sad face → neutral / 无委屈脸，用中性 |
| `drag` (being dragged) | `f05` | big grin / 拖拽，大笑 |
| `sleep` (idle > 60s) | `f08` | calm / 平静 |
| hover (idle/sleep) | `f06` | surprise, wide eyes / 惊讶瞪眼 |

**Motions / 动作**：Haru only ships `Idle` + `Tap` groups. The idle motion runs
constantly; random `Tap` motions play as idle fidgets. There are no per-state
body animations on the sample — custom models can add a `TOOL_MOTION` map.

Haru 只带 `Idle` + `Tap` 两组动作：待机动作常驻，空闲时随机播 `Tap` 小动作。
样例模型没有按状态的专属动作——自定义模型可加 `TOOL_MOTION` 映射。

---

## Debug handles / 调试句柄

Open the browser console (F12) on the page with the pet:

| Handle / 句柄 | Purpose / 用途 |
|---|---|
| `window.__dshLive2dPetModel` | The loaded `Live2DModel` instance / 已加载的模型实例 |
| `pet('expr','motion')` | One-shot test: set expression + play motion (either may be omitted) / 一句测试：设表情+播动作（可省略） |
| `window.__dshLive2dPetToggle()` | Toggle the pet on/off programmatically / 编程式开关宠物 |
| `window.__dshLive2dPetFreeze = true` | **Freeze automatic linkage** (manual tests stick) — set `false` to resume. ⚠️ While frozen, real DSH turns will NOT update the pet. / **冻结自动联动**（手动测试不被状态覆盖），`false` 恢复。⚠️ 冻结期间真实流程不会更新宠物 |
| `window.__dshLive2dPetRoot` | The React root handle / React 根句柄 |

Example / 示例：

```js
pet('f02', 'Tap')   // thinking face + a random tap motion / 思考脸 + 随机小动作
pet('f04')          // done face only / 只切完成表情
window.__dshLive2dPetFreeze = false   // resume auto linkage / 恢复自动联动
```

---

## Bring your own model / 换自己的模型

1. Put your model folder under `assets/live2d/<model>/` (`.model3.json`, `.moc3`,
   textures, `.physics3.json`, `expressions/`, `motions/`).
2. Point `cordis.patch.yml` `config.model` at it.
3. Update `PHASE_EXPRESSION` (and optionally `TOOL_MOTION`) in
   `src/client/index.ts` to your model's expression/motion group names, then
   `pnpm build`.
4. Sync `lib/` + `assets/` to the target profile's `node_modules/dsh-live2d-pet/`,
   restart the server (patch/model changes), hard-refresh the page
   (Ctrl+Shift+R) — model/expression changes need the hard refresh to load.

> 把模型放进 `assets/live2d/<模型名>/`，配置 `model` 指向它，改好表情/动作映射，
> `pnpm build` 后同步到目标 profile，重启服务端（patch/模型改动），硬刷新页面
> （Ctrl+Shift+R，模型/表情改动必须硬刷新才加载）。

The architecture is model-agnostic — the pet is the harness, the model is the
skin. / 架构与模型无关——宠物是壳，模型是皮。

---

## Architecture & pitfalls / 架构与排雷

### How it works / 工作原理

```
DSH web page
├─ <head> script src="/pet/live2d/live2dcubismcore.min.js"   ← host half, injected via tapIndex
├─ client bundle (lib/client.js, single inlined file)
│   ├─ pixi.js + pixi-live2d-display/cubism4 (fully inlined)
│   ├─ Live2DPet component: anchor / drag / expression / motion / mouse tracking
│   └─ apply(): mount + session-state linkage + settings.section panel
└─ host routes /pet/live2d/* (prefix, serves model assets)
```

### Design constraints (all battle-tested) / 关键约束（全部实战排雷）

1. **No dynamic imports** — the DSH client module system can't load split
   chunks (`missed the module table`). Everything is statically inlined into a
   single file. / 禁止动态 import——DSH 客户端模块系统不认分包，必须全内联单文件。
2. **Cubism core must load first** — `pixi-live2d-display` checks
   `window.Live2DCubismCore` at module time; the host injects the core script
   into `<head>` before the bundle evaluates. / Cubism core 必须先行——host 在
   bundle 执行前注入到 head。
3. **Use the `cubism4` sub-entry** — the main entry checks both Cubism 2 and
   Cubism 4 runtimes; `import 'pixi-live2d-display/cubism4'` skips the Cubism 2
   check. / 只用 cubism4 子入口——绕过 Cubism 2 运行时检查。
4. **Prefix route without trailing slash** — the webserver matches prefixes
   with `${prefix}/`, a trailing slash becomes `//` and never matches. /
   前缀路由不带尾斜杠——带尾斜杠会拼成双斜杠匹配不上。
5. **React must be external** — an inlined second React instance breaks hooks
   in slots-rendered components (React error #321). `react`/`react-dom` come
   from the DSH host module table (same as `dsh-emoji-wallet`). / React 必须
   external——内联第二份 React 会让 slots 组件 hook 崩溃，从 DSH 模块表拿。
6. **`ctx.slots` needs the inject declaration** — both the package.json
   `dsh.client.inject` entry (`@deepseek-ai/dsh-client-ui-slots`) AND
   `export const inject = ['slots']` in the bundle are required, or you get
   "cannot get property slots without inject". / slots 按钮要双重 inject——
   package.json 包名 + bundle 里 `export const inject = ['slots']`。
7. **Physics output params are locked** — on some models, physics-driven
   parameters (e.g. tail `Param_Angle_Rotation_*`) are overwritten every frame;
   motions can't move them. / 物理输出参数被锁——物理每帧覆盖，动作曲线写不动。
8. **Drag offset sanity clamp** — a leftover absurd `dsh-live2d-pet-drag`
   localStorage value can push the pet off-screen; the loader clamps to the
   viewport and drops bad values. / 拖拽偏移钳制——异常残留偏移会被自动清除，
   防止宠物被怼出屏幕。
9. **Toggle must reset the session identity** — `tearDownSession()` resets
   `currentSessionId`/`lastKey`, otherwise toggling the pet off/on kills the
   state-linkage refresh loop forever (pet renders but never reacts). /
   toggle 必须重置会话身份——否则开关一次后状态联动永久死亡（宠物能显示但不再反应）。

### Node builtins in dependencies

`@pixi/utils` imports node's `url`; `scripts/url-shim.js` (a copy of the
[dsh-client-url-shim](https://github.com/ankesu/dsh-client-url-shim) plugin)
rewrites it to a browser-safe module at build time.

---

## Development / 开发

```bash
pnpm install
pnpm build        # tsdown → lib/client.js (browser) + lib/index.mjs (node)
pnpm typecheck    # tsc --noEmit
```

### Generator scripts / 生成器脚本

The plugin ships model-agnostic tooling under `scripts/`:

| Script / 脚本 | Purpose / 用途 |
|---|---|
| `scripts/gen-motions.mjs <assetsDir> [--force]` | Generate `motion3.json` actions + `exp3.json` expressions from code definitions. **Existing `*.exp3.json` are SKIPPED by default** (hand-tuned expressions win); `--force` overwrites them (use with care). / 从代码定义生成动作/表情；**默认跳过已存在的 exp3**（手动调参优先），`--force` 才覆盖 |
| `scripts/sync-expressions.mjs <assetsDir>` | Refresh the generator's expression defaults from the live exp3 files (keeps the generator in sync with hand-tuned assets). / 从资产现成 exp3 刷新生成器的表情默认值 |
| `scripts/expressions-data.mjs` | Generated data file (do not edit by hand). / 生成的数据文件，勿手改 |

### Workflow for editing expressions / motions / 改表情/动作流程

1. Hand-tune in **Live2D Cubism Viewer** (open the `.model3.json`, drag
   parameters / keyframes, export the exp3/motion3) — or edit the generator
   definitions.
2. `node scripts/sync-expressions.mjs <assetsDir>` to refresh expression
   defaults (hand-tuning wins; the generator never overwrites existing exp3).
3. `pnpm build` → sync `lib/` + `assets/` to the target profile.
4. Hard-refresh the page (Ctrl+Shift+R) — model/expression changes need it.

> 人工调参用 **Live2D Cubism Viewer** 打开 `.model3.json` 拖参数/摆关键帧，导出
> exp3/motion3 即生效。表情手动调参后跑同步脚本刷新生成器默认值——生成器永不覆盖
> 已有表情文件。

---

## License / 许可

MIT (upstream copyright © ankesu — see [`LICENSE`](./LICENSE)). Additional
modifications in this fork by [lizekun793-beep](https://github.com/lizekun793-beep).

The bundled **Haru / Tororo / Hijiki** sample models are © Live2D Inc.,
distributed under the official Live2D sample-model license for testing and
demonstration — replace them for production use.

MIT（上游版权 © ankesu，见 [`LICENSE`](./LICENSE)）。本 fork 额外改动由
[lizekun793-beep](https://github.com/lizekun793-beep) 完成。

附带 **Haru / Tororo / Hijiki** 样例模型 © Live2D Inc.，按官方样例模型许可仅供
测试演示——生产环境请替换为自己的模型。
