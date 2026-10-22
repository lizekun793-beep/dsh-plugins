# DSH 生图 API（Image Generation）

给 DeepSeek Harness 增加一个 `generate_image` 工具：通过任意 **OpenAI 兼容** 的图片生成接口，用文字提示词出图，并把图片保存到当前会话工作区的 `generated-images/` 目录。接口地址、模型和 API Key 都在 **插件** 页里配置。

> **同系列 monorepo / Same series：** [`lizekun793-beep/dsh-plugins`](https://github.com/lizekun793-beep/dsh-plugins)
> - [dsh-live2d-pet](../dsh-live2d-pet/) — Live2D 桌宠
> - [dsh-custom-background](../dsh-custom-background/) — 聊天自定义背景
> - [dsh-image-gen](./) — OpenAI 兼容生图工具

![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-%E2%89%A50.2.1--rc.2-4B6BFB)
![License](https://img.shields.io/badge/license-MIT-green)

## 功能

- 注册模型可调用的 `generate_image` 工具（参数：`prompt`、可选 `size`、可选 `filename`）。
- 适配 OpenAI Images API：

  ```http
  POST {baseURL}/images/generations
  Authorization: Bearer {apiKey}
  Content-Type: application/json

  {"model": "...", "prompt": "...", "size": "1024x1024", "n": 1}
  ```

  - `baseURL` 末尾会自动补 `/images/generations`；已经写到该路径也不会重复拼接。
  - 返回 `data[0].b64_json`、`data[0].url`、`data:image/...` 或顶层 `b64_json` / `url` 都能解析。
  - 远端 URL 会由 Host 侧下载，单张上限 32 MB。
- 支持 PNG / JPEG / WebP / GIF；返回其它格式会明确报错。
- 文件名可自定义，默认 `image-<时间戳>-<随机hex>`；会做路径穿越清洗。
- 生成的图片写入会话工作区 `generated-images/`，并在工具结果里给出可直接渲染的相对路径。
- 配置保存在插件自身的 volatile Config 中，在 **插件** 页保存后立即生效，无需重启。

## 环境要求

- DeepSeek Harness **0.2.1-rc.2** 或兼容版本
- **Web** profile（`dsh web`）
- Node.js 22+（需要内置 `fetch`、`AbortSignal.any`）
- pnpm

## 安装

假设 DSH profile 在默认位置 `~/.dsh/profiles/web`；自定义过 `$DSH_HOME` 的话替换成实际路径。

### 方式 A：DSH CLI（推荐，monorepo）

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-image-gen" --registry=https://registry.npmmirror.com
```

独立仓库（备用 / legacy）：

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-image-gen#main" --registry=https://registry.npmmirror.com
```

### 方式 B：克隆后 link（改代码后立即生效）

```bash
git clone https://github.com/lizekun793-beep/dsh-plugins.git ~/.dsh/plugins/dsh-plugins
# then link the subfolder:
# pnpm add "link:$HOME/.dsh/plugins/dsh-plugins/dsh-image-gen"

cd ~/.dsh/profiles/web
pnpm add "link:$HOME/.dsh/plugins/image-gen"
```

### 方式 C：直接作为 GitHub 依赖安装

```bash
cd ~/.dsh/profiles/web
pnpm add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-image-gen"
```

### 注册 bundle

打开 `~/.dsh/profiles/web/package.json`，确认依赖里有 `@local/image-gen`，并加入 `dsh.profile.bundles`：

```json
{
  "dependencies": {
    "@local/image-gen": "link:/home/you/.dsh/plugins/image-gen"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@local/image-gen"
      ]
    }
  }
}
```

重启：

```bash
dsh web
```

> `@local/image-gen` 是 manifest 里的包名，`bundles` 必须写它；GitHub 仓库名可以另取。

> 如果 `pnpm` 提示未满足 `@deepseek-ai/dsh-tools` 等 peerDependencies，可以忽略：DSH 的 profile 默认 `autoInstallPeers: false`，这些包由 DSH 运行时按声明提供给插件，不需要另装。

## 配置

1. 打开 Web UI 侧边栏 **插件**。
2. 找到 **生图 API / Image Generation (API)** 这个 bundle，展开它的 `image-gen` 行。
3. 点 **配置 / Configure**，填写：

   | 字段 | 说明 | 示例 |
   | --- | --- | --- |
   | API base URL | OpenAI 兼容接口的 base URL；也可直接填完整 `/images/generations` 地址 | `https://api.openai.com/v1` |
   | Model | 服务商的图片模型名 | `gpt-image-1`、`dall-e-3`、`qwen-image-3.0` |
   | API key | 作为 `Authorization: Bearer` 发送；只有匿名接口才留空 | `sk-...` |

4. 保存。三个字段都是 volatile Config，运行中的工具下一次调用就会读取新值。

## 使用

直接让 agent 画图，例如：

> 画一张雨夜霓虹街道，赛博朋克风格，16:9。

agent 会调用：

```json
{
  "prompt": "rainy neon street at night, cyberpunk, cinematic lighting",
  "size": "1792x1024",
  "filename": "neon-street"
}
```

图片保存为 `<session workspace>/generated-images/neon-street.png`，并在回复里以 Markdown 图片展示。

## 安全说明

- **API Key 不保存在本仓库**。它写在你 profile 的插件配置里（当前实现是 profile 的 `cordis.patch.yml` 中 `image-gen` 行的 `apiKey` 字段，明文）。
- 不要把带 key 的 `cordis.patch.yml` 提交到 Git；分享配置前先清空 `apiKey`。
- 插件会把 prompt 和 key 发送到你配置的接口地址；请只配置可信的服务商。
- 生成结果会写入会话工作区，注意不要把私密图片一起提交。

## 实现

- `index.js`：Host 半。注册 `generate_image` 工具；解析 endpoint、拼接请求、解码 b64/URL、检查文件签名、写入工作区。
- `client.js`：浏览器半。在 **插件** 页注册 `plugins.row.config`，编辑 `image-gen` 设置命名空间。
- `cordis.patch.yml`：bundle 的插件插入声明，`config` 默认为空。
- `locale/*.json`：中英文标题与描述。

Host 半依赖 `@deepseek-ai/dsh-tools` 和 `@deepseek-ai/schemastery`，它们在 `package.json` 里声明为 `peerDependencies`，由 DSH 运行时提供；不需要把 `node_modules` 一起提交。

## License

[MIT](./LICENSE)
