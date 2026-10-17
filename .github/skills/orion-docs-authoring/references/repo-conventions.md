# 本仓文档约定

只记录**写内容文档时必须遵守的工程约定**。样式、组件、配置的改动不在本 skill 范围。

## 语言：写给用户，不写给开发

读者能看到的才写。看不到的一律不写：

| 不写 | 原因 |
|---|---|
| 框架与组件库名（画布内核、图表库、编辑器库） | 用户不选型，只关心能用 |
| 产品底座的技术名 | 用户买的是 ORION |
| 像素值（`440px`） | 换用「固定宽度 / 自适应」这类感知描述 |
| 内部字段名、接口路径、标识符 | 换用界面上看得到的名称 |
| 存储实现（本地库、缓存键名） | 换用「保存在当前浏览器」「服务端已保存」 |
| 图标编码（`save`、`cloud_done`） | 换用按钮名称 |

---

## 目录与落点

```
src/content/docs/
├── index.mdx                 # 中文首页（splash）
├── en/index.mdx              # 英文首页
├── ja/index.mdx              # 日文首页
├── guides/                   # Tutorial
├── howto/<模块>/             # How-to，模块取 build / run / optimize / admin
├── reference/<体系>/         # Reference（如 reference/bpmn/task/）
├── bestpractices/            # Explanation + 方法论文章
└── reference/api.mdx         # Scalar 挂载的 REST API 页
```

### 四个产品模块的写法

模块**标识**一律用小写英文（目录名、URL 段），**界面文案**按语言写：

| 模块标识 | 中文 | English | 日本語 |
| :--- | :--- | :--- | :--- |
| `build` | 设计 | Build | 設計 |
| `run` | 运行 | Run | 実行 |
| `optimize` | 优化 | Optimize | 最適化 |
| `admin` | 管理 | Admin | 管理 |

**中文正文不要写「Build 模块」**——中文界面上它叫「设计」。同理日文写「設計」。
反过来说，URL 与目录保持 `build`，别因为中文叫「设计」就把目录改回 `design`
（会与旧链接冲突，也不是模块标识）。

`guides` / `howto/build` / `reference/*` / `bestpractices` 在 `astro.config.mjs` 的
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
- 缺翻译时 Astro 会**静默回退中文**（`/en/xxx/` 返回 200、`lang="en"`、内容是中文）。
  这是预留行为，不是 bug；但写多语言时别指望它——读者看到的是一篇外语标题的中文。

### 主笔语言与顺序

**先用中文写，再逐语言做本地化重写。** 不是「先英文再翻中日」，也不是逐句对译。

理由：决定译文对不对的不是语言顺序，而是**有没有对着该语言的界面核名词**。

- 中文主笔：`root` 是 zh-CN、存量内容全是中文、团队母语是中文。用英文主笔会让
  绝大多数读者变成译文的读者，而且没人能发现英文读起来别扭。
- en / ja 是**本地化重写**：句子按该语言习惯重写，删掉中文特有行文（四字格、
  「详见」「如上」、编号小标题），不要一句一句搬。

### 三种语言各对一份界面

同一份文档的三种语言，上游是三份不同的界面文案。**逐条把名词换成该语言界面上的真实文案**，
不要从中文直译。来源是相邻仓 `orion-monorepo`：

| 内容 | 唯一来源 |
|---|---|
| 应用级文案（工具栏、面板、视窗、按钮） | `packages/features/src/i18n/index.ts` 的 `zh` / `en` / `ja` 三块 |
| 建模器的元素名、属性名 | `packages/bpmn/src/i18n/bpmn/zh.ts`、`ja.ts`（英文没有字典，键名即英文原文） |
| 建模托盘条目 | `bpmn-js-i18n/translations/zn.js`、`ja.js` 与 `packages/bpmn/src/i18n/bpmn/zh.ts` |

抽样方法（英文没有字典，靠中文块反查）：

```bash
# 在 monorepo 根目录，按中文值反查 key，再看 en / ja 两块的值
python3 - <<'PY'
import re
lines = open('packages/features/src/i18n/index.ts', encoding='utf-8').read().split('\n')
def block(a, b):
    d = {}
    for l in lines[a:b]:
        m = re.match(r"\s*'([^']+)':\s*'((?:[^'\\]|\\.)*)'", l)
        if m: d[m.group(1)] = m.group(2)
    return d
zh, en, ja = block(42, 8326), block(8326, 16340), block(16340, 24134)
for k, v in zh.items():
    if v == '属性面板': print(k, '|', en.get(k), '|', ja.get(k))
PY
```

已核对过的对照（2026-10，界面当前用词）：

| 中文 | English | 日本語 |
|---|---|---|
| 设计视图 / 开发视图 | Designer view / Developer view | 設計ビュー / 開発ビュー |
| 属性面板 | Properties | プロパティ |
| 流程文档 | Process document | プロセスドキュメント |
| 历史 / 本机历史 / 在线版本 | History / On this device / Online versions | 履歴 / この端末の履歴 / オンライン版 |
| 差异对比 | Compare differences | 差分比較 |
| 业务架构 / 业务域 / 流程组 | Business architecture / Business domain / Process group | ビジネスアーキテクチャ / ビジネスドメイン / プロセスグループ |
| 添加元素 / 标准元素 / 增强元素 | Add element / Standard / Enhancements | 要素を追加 / 標準要素 / 拡張要素 |
| 节点评论 / 元素文档 | Node comments / Element document | ノードコメント / 要素ドキュメント |
| AI 对话助手 | AI Assistant | AI アシスタント |
| 仿真 / 部署 | Simulation / Deploy | シミュレーション / デプロイ |
| 适应窗口 | Fit to viewport | ビューポートに合わせる |
| 更多操作 | More actions | その他の操作 |

⚠️ 界面改词后文档会静默过期。**凡是要写某个控件名，先去上表来源核一遍**，
不要凭记忆或从中文直译——中文侧自己也可能已经改过（「设计师视图」就改成了「设计视图」）。

⚠️ 英文拼写用**美式**（`color` / `behavior` / `organize`）：产品英文文案以美式为主。

### 锚点各写各的

标题由各语言自己写，锚点也就各不相同。**跨语言复制正文时，`](#…)` 必须逐个重算**，
否则链接静默跳空。linter 的 `link/anchor-not-found` 会接住这一类。

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

### 页内跳转

正文里写「详见 7.4」这种**裸编号**，读者点不动、得自己滚半天才能找到——必须给成链接：

```markdown
| 差异对比 | 打开并排比对视图，详见 [7.4 差异对比](#74-差异对比) |
```

锚点是 Starlight 按标题**自动生成**的，规则：去掉点号、空格换连字符、ASCII 小写、
中文原样保留、数字保留。`## 1. 描述` → `#1-描述`；`### 7.8 AI 对话助手` → `#78-ai-对话助手`。

⚠️ **MDX 里没有自定义锚点语法**。`## 标题 {#custom-id}` 是纯 Markdown/CommonMark 的写法，
MDX 会把 `{...}` 当表达式解析，构建直接失败：

```
Caused by: Unexpected token
```

⇒ 只能顺着自动生成的 slug 来。想验证锚点对不对，构建后从 `dist/` 里读：

```bash
grep -o 'id="[^"]*"' dist/reference/bpmn/modeler/index.html | sort -u
```

改标题就等于改锚点，**改完标题必须回头搜一遍全站有没有 `](#旧锚点)`**。

## 表格

表格的样式在 `src/styles/custom.css` 末尾：单元格有 `min-width: 5rem` 的下限，
放不下时表格自己出横向滚动条（并带一条可见的滚动条），**不会**把「类型」「必填」
这类短列压成一字一行。

写的时候按这个前提排版：

- **一个单元格里别塞超长不可断的标识符**（`META-INF/services/org.camunda.spin.spi.DataFormatConfigurator`
  这种 45+ 字符的路径）。它会把整张表撑宽、把旁边的文字列挤到只剩几十像素。
  拆法：固定前缀写进表头，单元格只留变化的部分；或干脆把长路径挪到正文的代码块里
- 单元格不用手写换行，也别为了「好看」把一句话拆成多段——宽度不够时表格会滚动
- 列多时优先减列，而不是压缩字号

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
| How-to | `src/content/docs/howto/build/project.mdx` |
| Reference | `src/content/docs/reference/bpmn/task/user.mdx` |
| Explanation | `src/content/docs/bestpractices/aboutboatengine.mdx` |
