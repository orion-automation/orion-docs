# 本仓文档约定

只记录**写内容文档时必须遵守的工程约定**。样式、组件、配置的改动不在本 skill 范围。

---

## 目录与落点

```
src/content/docs/
├── index.mdx                 # 中文首页（splash）
├── en/index.mdx              # 英文首页
├── ja/index.mdx              # 日文首页
├── guides/                   # Tutorial
├── howto/<领域>/             # How-to（如 howto/design/）
├── reference/<体系>/         # Reference（如 reference/bpmn/task/）
├── bestpractices/            # Explanation + 方法论文章
└── reference/api.mdx         # Scalar 挂载的 REST API 页
```

`guides` / `howto/design` / `reference/*` / `bestpractices` 在 `astro.config.mjs` 的
`sidebar` 中已用 `autogenerate` 注册，**新文件放进这些目录即自动出现在侧边栏**。
只有在新增一个顶层大类（新目录且不在任何 autogenerate 下）时才需要改配置。

## Frontmatter

```yaml
---
title: 用户任务                 # 必填。会渲染成页面 h1，所以正文不要再写同名 h1
description: …的参考。          # 必填。≤120 字为宜，会进 <meta> 与卡片
sidebar:
  order: 2                     # 同目录内排序；reference/ 与 howto/ 里普遍使用
---
```

可选：`hero:`（仅 splash 首页）、`tableOfContents: false`、`banner:`。
**不要**手写 `slug`，路径即 slug。

`title` 按类型取范式：Tutorial 用动词短语、How-to 用「如何…」、Reference 用名词、
Explanation 用「关于…/为什么…」。

## 多语言

`locales: { root: 中文, en: English, ja: 日本語 }`，`defaultLocale: 'root'`。

- 默认语言（中文）**没有 URL 前缀**，落点是 `src/content/docs/<path>`
- 英文放 `src/content/docs/en/<与中文完全相同的相对路径>`
- 日文放 `src/content/docs/ja/...`
- **绝不要新建 `zh-cn/` 或其他未声明的语言目录**：会生成一批 404 幽灵路由并污染
  sitemap（本仓踩过一次，只能整目录删掉）
- 新写文档默认只写中文；需要多语言时同步补 `en` / `ja` 的同路径文件

## 可用组件

从 `@astrojs/starlight/components` 具名导入（**不要**写 `user-components/...` 深路径，
那个路径不在包 exports 里，dev 会每次请求报 `is not exported`）：

`Aside` `Badge` `Card` `CardGrid` `Icon` `Tabs` `TabItem` `LinkCard` `Steps`
`FileTree` `LinkButton`

```mdx
import { Tabs, TabItem, Badge } from '@astrojs/starlight/components';
```

MDX 里用了组件就必须 import，否则构建失败（linter 会查这一条）。

### Aside 写法（允许，且是唯一的旁白手段）

```markdown
:::tip[架构洞察]
:::
```

闭合行必须是单独的 `:::`；不支持嵌套。**禁止**在 Aside 标题里用 Emoji 或图标。

### 其他已启用的能力

| 能力 | 写法 | 说明 |
|---|---|---|
| 数学公式 | `$E=mc^2$`、`$$…$$` | remark-math + rehype-katex；`head` 里引的是 KaTeX 0.16.9 CDN |
| 流程图 | ` ```mermaid ` | astro-mermaid，`autoTheme` 跟随深浅色 |
| OpenAPI | `reference/api.mdx` | 由 Scalar 渲染，不要手写接口文档 |
| 首段导语 | `<p class="lead">…</p>` | 首页与部分指南使用，正文非必需 |

## 链接

- `site` = `https://docs.eorion.com`，`base` = `/`，站内链接写以 `/` 开头的**根相对路径**
  （`/reference/bpmn/task/user/`），不要写完整域名、不要写 `.mdx`
- 跨类型互链是四型协作的核心手段：Tutorial 末尾给 Explanation / How-to 链接；
  How-to 讲参数时给 Reference 链接；Reference 与 Explanation 之间互链
- 站外链接用真实 URL。**禁止占位链接**（`[Reference Guide](url)`）——那是给 AI 草稿用的，
  进仓库前必须换成真实 slug
- 新窗口打开用 `target="_blank" rel="noopener noreferrer"`

## 校验

```bash
node .github/skills/orion-docs-authoring/scripts/lint-diataxis.mjs <文件或目录>
npm run check                 # tsc --noEmit
npm run build                 # 预期 201 页
```

`npm run check:astro`（`astro check`）在本机 16GB 内存下会 OOM，**不要用**。

目视确认：

```bash
npx astro dev --background    # http://localhost:4321
npx astro dev logs
npx astro dev stop
```

## 已验收的写法样例

| 类型 | 参考文件 |
|---|---|
| Tutorial | `src/content/docs/guides/deploy.mdx` |
| How-to | `src/content/docs/howto/design/project.mdx` |
| Reference | `src/content/docs/reference/bpmn/task/user.mdx` |
| Explanation | `src/content/docs/bestpractices/aboutboatengine.mdx` |
