# DSH Plugins (lizekun793-beep)

DeepSeek Harness（DSH）插件系列 monorepo：桌宠、聊天背景、生图、模型 API 图标放在同一个仓库里，按子目录安装。

A series of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugins in one repo — install each plugin by subdirectory path.

## Plugins / 插件

| 目录 | 包名 (`dsh.profile.bundles`) | 说明 |
|------|------------------------------|------|
| [`dsh-live2d-pet/`](./dsh-live2d-pet/) | `dsh-live2d-pet` | Live2D 桌宠（Cubism / pixi），状态表情与鼠标跟随。基于 [ankesu/dsh-live2d-pet](https://github.com/ankesu/dsh-live2d-pet) 魔改。 |
| [`dsh-custom-background/`](./dsh-custom-background/) | `@local/custom-background` | 会话面板自定义背景：图库、外链、裁剪、调暗/模糊。 |
| [`dsh-image-gen/`](./dsh-image-gen/) | `@local/image-gen` | OpenAI 兼容生图工具，配置写在插件页。 |
| [`dsh-api-model-icons/`](./dsh-api-model-icons/) | `dsh-api-model-icons` | 模型选择器旁显示 DeepSeek / 千问 / 豆包等 API 提供商官方标志。 |

每个子目录都有完整 README（中英或中文）。

## Install / 安装

用 pnpm 子目录语法；**整个 specifier 请加引号**。国内源建议带 `--registry`：

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-live2d-pet" --registry=https://registry.npmmirror.com
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-custom-background" --registry=https://registry.npmmirror.com
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-image-gen" --registry=https://registry.npmmirror.com
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-api-model-icons" --registry=https://registry.npmmirror.com
```

装完后：

1. 确认 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 里写的是**包名**（见上表），不是仓库名或文件夹名。
2. 重启对应 profile（例如 `dsh web`），硬刷新浏览器。

### Bundle 包名注意

- `custom-background` / `image-gen` 的 package name 仍是 `@local/custom-background` 与 `@local/image-gen`——`bundles` 必须写这两个名字。
- Live2D 的 package name 是 `dsh-live2d-pet`。上游原作者：[ankesu](https://github.com/ankesu)。
- 模型 API 图标的 package name 是 `dsh-api-model-icons`。

### Manager GUI

插件管理器里填 Git URL 有时会误报「无法从依赖变更中确定安装了哪一个包」。优先用上面的 `dsh plugin … add` CLI，再用 `dsh plugin --profile web list` 确认。

## Standalone mirrors / 独立仓库（可选）

三个插件也曾各自单独建库，现作为镜像保留（README 已指向本 monorepo）：

- https://github.com/lizekun793-beep/dsh-live2d-pet
- https://github.com/lizekun793-beep/dsh-custom-background
- https://github.com/lizekun793-beep/dsh-image-gen

**推荐只从本仓库按 `path:/…` 安装。**

## License

MIT（见根目录 [`LICENSE`](./LICENSE)）。`dsh-live2d-pet/` 另有自己的 LICENSE，保留上游 ankesu 的 MIT 声明；附带 Live2D 样例模型 © Live2D Inc.，仅供测试演示。
