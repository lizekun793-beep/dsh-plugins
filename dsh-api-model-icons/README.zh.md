# DSH 模型 API 图标

[English](README.md) | [中文](README.zh.md)

> **同系列 monorepo：** [`lizekun793-beep/dsh-plugins`](https://github.com/lizekun793-beep/dsh-plugins)
> - [dsh-live2d-pet](../dsh-live2d-pet/) — Live2D 桌宠
> - [dsh-custom-background](../dsh-custom-background/) — 聊天自定义背景
> - [dsh-image-gen](../dsh-image-gen/) — OpenAI 兼容生图工具
> - [dsh-api-model-icons](./) — 模型选择器 API 提供商图标

为 DeepSeek Harness 输入框的模型选择器显示各 API 提供商的官方标志。

![provider marks](assets/banner.svg)

## 功能

输入框的模型菜单按 API 提供商分组。这个插件在模型名称旁显示对应提供商的官方标志，覆盖所有出现标签的位置：

- 输入框工具栏的模型触发器；
- 模型菜单中的当前模型值；
- 每一个可选模型条目。

| 提供商 | 标志 |
| --- | --- |
| DeepSeek（官方 / 账户） | <img src="assets/deepseek.svg" width="20" height="20" alt="DeepSeek"> |
| 千问 / Qwen（阿里云百炼） | <img src="assets/qwen.svg" width="20" height="20" alt="Qwen"> |
| 豆包 / Doubao（火山引擎） | <img src="assets/doubao.svg" width="20" height="20" alt="Doubao"> |
| 其他提供商 | 中性地球 |

标志放在 16px 白色底板上、内部为 14px 官方标志。白色底板在浅色主题下几乎不可见，在深色主题下能让千问、豆包偏深的蓝色部分保持清晰。

## 安装

前提：

- DeepSeek Harness，并启用 Web 应用（`@deepseek-ai/dsh-web-app`）。
- 随 Web 应用提供的 `@deepseek-ai/dsh-client-ui-model-selection` 插件，它声明了 `conversation.input.model.label` 插槽。

步骤：

1. 克隆本仓库。
2. 在 Harness 的插件管理器里使用 `install_bundle`，传入本目录的绝对路径。插件行由 [`cordis.patch.yml`](cordis.patch.yml) 声明，无需任何配置。
3. 刷新 Web 页面。插件会在 **设置 → 插件** 中显示为 **模型 API 图标**（中文）或 **Model API Icons**（英文）。

这是一个 profile bundle，会对该 profile 内的所有会话生效。它是纯 Client 模块，Host 半部分只有一个空的 `apply()`。

### 从 GitHub 安装（推荐，monorepo）

```bash
dsh plugin --profile web add "github:lizekun793-beep/dsh-plugins#main&path:/dsh-api-model-icons" --registry=https://registry.npmmirror.com
```

`dsh.profile.bundles` 里的包名是 `dsh-api-model-icons`。装完后重启 profile，并硬刷新浏览器。

## 验证

1. 打开一个会话，点击输入框右下角的模型控件。
2. 触发器、**模型** 当前值和每个模型条目都会在模型名前显示提供商标志。
3. DeepSeek-V4.1-Flash 仍会保留随应用提供的 `1017` 发布标记。
4. 新增或未识别的提供商显示中性地球，而不会丢失标签。

## 实现方式

Client 半部分注册到单值插槽 `conversation.input.model.label`，优先级为 `-1`。该插槽中**数值最低的优先级渲染**，因此插件可以替换模型选择包原本渲染的标签。

Host 在三种位置分别传入 `provider`、`model`、`placement`、`selected` owner props。组件渲染一个内联 `span`，包含提供商标志、模型目录名称，以及可选的 `1017` 标记。插件不发起网络请求、不持有状态，也不增加 Host 界面。

## 自定义提供商图标

提供商匹配逻辑在 [`client.js`](client.js) 的 `iconKind()` 中，SVG 路径在同文件的 `LOGOS` 对象中。新增提供商：

1. 在 `iconKind()` 中增加一个分支，识别提供商 id 或显示名称。
2. 在 `LOGOS` 中增加对应 key 的 SVG 路径。
3. 运行 `npm test` 校验包结构。

未匹配的提供商会回退到地球图标，因此新增提供商不会导致标签消失。

## 兼容性与注意事项

- 已在 DeepSeek Harness `0.2.1-rc.2` 的 Web profile 上测试。
- `conversation.input.model.label` 是 `single` 插槽。插件故意用更低的优先级替换原标签占用者；另一个同优先级的标签插件会冲突，数值最低者渲染。
- 插件复现了随应用提供的 `1017` 标记的精确触发条件，因此装饰标签不会移除该标记。
- 仓库保留 `"private": true` 以防止误发布到 npm；如需发布请删除该字段。

## 商标与许可

插件代码使用 MIT 许可，见 [`LICENSE`](LICENSE)。

DeepSeek、Qwen（千问）、Doubao（豆包）标志是各自所有者的商标。这里仅用于标识所配置的 API 提供商，不代表官方背书。SVG 路径来自 [`@lobehub/icons-static-svg`](https://github.com/lobehub/lobe-icons) 1.97.0（MIT 许可）；详见 [`NOTICE.md`](NOTICE.md) 和 [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md)。

如需再分发，请根据你的使用场景确认各品牌的商标政策。
