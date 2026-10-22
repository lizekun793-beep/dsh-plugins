# DSH 自定义背景（Custom Background）

给 DeepSeek Harness Web UI 的会话面板换背景的插件：图片保存在服务端，刷新、换浏览器、重启后都还在；支持上传图库、外链 URL、按面板比例裁剪，以及调暗和模糊。

> **同系列 monorepo / Same series：** [`lizekun793-beep/dsh-plugins`](https://github.com/lizekun793-beep/dsh-plugins)
> - [dsh-live2d-pet](../dsh-live2d-pet/) — Live2D 桌宠
> - [dsh-custom-background](./) — 聊天自定义背景
> - [dsh-image-gen](../dsh-image-gen/) — OpenAI 兼容生图工具

![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-%E2%89%A50.2.1--rc.2-4B6BFB)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能

- **设置 → 聊天背景** 新增一个独立设置分区。
- **图库**：上传 PNG / JPEG / WebP / GIF，服务端持久化，多浏览器共享；最多 40 张，单张入库上限 8 MB（客户端会把超大图缩到最长边 2560 px）。
- **外链**：直接填 `https://` 图片地址，不占图库空间。
- **裁剪**：拖拽框选可见区域，选框比例跟随会话面板，窗口尺寸变化也能保持构图。
- **调暗 / 模糊**：调暗 0–80%，模糊 0–20 px。
- **一键开关**：随时显示或隐藏背景，不影响聊天。
- 配置与图片写在当前 DSH profile 目录：
  - `custom-background.json` — 设置与图库索引
  - `custom-background.images/` — 图片原文件

## 环境要求

- DeepSeek Harness **0.2.1-rc.2** 或兼容版本
- **Web** profile（`dsh web`）
- Node.js 22+
- pnpm

## 安装

假设 DSH profile 在默认位置 `~/.dsh/profiles/web`；如果你用 `$DSH_HOME` 自定义过，替换成实际路径。

### 方式 A：DSH CLI（推荐，monorepo）

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-custom-background" --registry=https://registry.npmmirror.com
```

独立仓库（备用 / legacy）：

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-custom-background#main" --registry=https://registry.npmmirror.com
```

### 方式 B：克隆后 link（改代码后立即生效）

```bash
git clone https://github.com/lizekun793-beep/dsh-plugins.git ~/.dsh/plugins/dsh-plugins
# then link the subfolder:
# pnpm add "link:$HOME/.dsh/plugins/dsh-plugins/dsh-custom-background"

cd ~/.dsh/profiles/web
pnpm add "link:$HOME/.dsh/plugins/custom-background"
```

### 方式 C：直接作为 GitHub 依赖安装

```bash
cd ~/.dsh/profiles/web
pnpm add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-custom-background"
```

### 注册 bundle

打开 `~/.dsh/profiles/web/package.json`，确认依赖里有 `@local/custom-background`，并把它加入 `dsh.profile.bundles`：

```json
{
  "dependencies": {
    "@local/custom-background": "link:/home/you/.dsh/plugins/custom-background"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/custom-background"
      ]
    }
  }
}
```

然后重启：

```bash
dsh web
```

刷新页面，打开 **设置 → 聊天背景** 即可。

> `@local/custom-background` 是插件 manifest 里的包名，`bundles` 必须写这个名字；GitHub 仓库叫什么名字都可以。

## 使用

1. 打开 **设置 → 聊天背景**。
2. 打开「显示背景」开关。
3. 上传一张图片（或粘贴 URL），点图库里的缩略图选中。
4. 需要时点「调整裁剪」框选区域，再调「调暗」「模糊」。
5. 「×」删除图库图片，「移除」清除当前选择。

图片是**服务端保存**的：同一 profile 下所有浏览器看到同一套图库，换设备也能用。

## 卸载

```bash
cd ~/.dsh/profiles/web
pnpm remove @local/custom-background
```

再从 `dsh.profile.bundles` 里删掉 `@local/custom-background`，重启 `dsh web`。  
图库文件不会自动删除；需要彻底清理时删除 profile 目录下的 `custom-background.json` 和 `custom-background.images/`。

## 实现

- `index.js`：Host 半。通过 `ctx.connection.fetch.register` 提供三个认证路由：
  - `GET/PUT /api/custom-background.settings`
  - `POST/GET/DELETE /api/custom-background.image`
  - `POST /api/custom-background.debug`
- `client.js`：浏览器半。注册 `settings.section` 槽位，渲染设置面板，并把背景样式注入页面。
- `cordis.patch.yml`：bundle 的插件插入声明。
- `locale/*.json`：中英文标题与描述。

## 安全说明

- 插件本身不包含任何密钥或账号信息。
- 上传的图片只保存在你的 DSH profile 目录，不会上传到第三方（除非你主动使用外链 URL）。
- 如果你把整个 profile 目录提交到 Git，请排除 `custom-background.json`、`custom-background.images/` 和任何 `*.debug.log`；本仓库的 `.gitignore` 已覆盖插件源码目录里的常见产物。

## License

[MIT](./LICENSE)
