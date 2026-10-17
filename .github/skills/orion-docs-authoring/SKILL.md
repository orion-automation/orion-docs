---
name: orion-docs-authoring
description: '按 Diátaxis 四型（Tutorial / How-to / Reference / Explanation）为 ORION 文档站撰写或审查内容文档。Use when: 写文档、新增页面、补文档、改写文章、写教程、写操作指南、写参考手册、写概念解析、翻译文档到 en/ja、review docs PR、判断该写哪种文档类型、检查文档是否符合规范、Diátaxis、Starlight MDX 文档、frontmatter、侧边栏、bestpractices、howto、reference、tutorial。'
argument-hint: '[要写的主题] 或 [要审查的文件路径]'
---

# ORION 文档撰写（Diátaxis）

本仓是 Astro + Starlight 文档站。所有内容文档必须落进 Diátaxis 四型之一，
**先选型，再动笔**——四型混写是本项目最常见、也最难事后修的问题。

## 第一条：读者不是我们

写任何一句话之前先问：**谁会读这句？** 本仓文档的读者是业务设计者、流程架构师、
实施人员——**他们不读代码，也不该知道我们用了什么技术**。

| 不要写 | 要写 |
|---|---|
| 画布由 `bpmn-js` 提供 | 画布 |
| 底层基于 Camunda 7 引擎 | 引擎 / ORION 的流程引擎 |
| 面板宽 440px | 面板宽度固定，随画布自适应上限 |
| 图标字形为 `cloud_done` | 当前在线版本标识 |
| 写入 `configJson` / `businessObject` | 作为资源配置信息保存 / 随模型保存 |
| 数据存在 IndexedDB | 保存在当前浏览器本地 |
| 从 DOM 移除 | 收纳后不再占位 |
| 撤销栈 | 撤销历史 |

这条的判据很硬：**用户能不能在界面上看到它。** 看不到的（语言、框架、像素值、
字段名、接口路径、图标编码）一律不写。技术名哪怕准确也是错的——它回答的是
「怎么做的」，而 Reference 回答的是「它是什么、能做什么」。

linter 会把 `bpmn-js` / `DOM` / `IndexedDB` / `configJson` 等判为 error，
把 `Camunda` 与像素值判为 warn。

**例外：`reference/spin/` 与 `reference/connector/` 下的开发者接口参考。**
这些页面的读者就是写代码的人，`DOM`、`JAXBContext`、`ObjectMapper` 既是公开 API
（`SpinXmlDomElement`、`setObjectMapper`）也是要查的东西 —— 把它们抹掉反而看不懂。
linter 的 `DEV_API_PATH` 只豁免 `prose/impl-leak` 一条，其余机械规则照常。
产品说明（`howto/`、`bestpractices/`、`guides/`）没有任何豁免。

## 第二条：一种语言写到底

不要中英对照。章节标题、字段名、正文一律只用当前语言：

| 不要写 | 要写 |
|---|---|
| `## 1. 描述 (Description)` | `## 1. 描述` |
| `建模托盘 (Palette)` | `建模托盘` |
| `业务流程 (Process) 资产` | `业务流程资产` |

只留两类英文：专有名词与格式（BPMN、AI、Markdown、PNG/SVG、`⌘S`），
以及首次引入的**术语原文**（「协同 (Choreography) 与编排 (Orchestration)」——
这里英文是术语本身，删了读者对不上行业说法）。

判断口诀：**把括号删掉，句子还成立吗？** 成立就删。

权威全文（面向人的规范，含完整创作 Prompt）：
`src/content/docs/bestpractices/write{tutorial,howto,reference,explanation}.mdx`。
本 skill 只抽取其中**可判定、可校验**的部分，并在两者冲突时以那四篇为准。

## 何时使用

- 用户要求写 / 补 / 改一篇文档，或给某个功能、API、BPMN 元素补说明
- 用户给出一个文件让你 review 是否符合规范
- 需要判断「这个内容该写成哪种文档」
- 需要把现有文档翻译成 `en` / `ja`

不适用：改样式、改组件、改配置、修构建——那些与文档内容无关。

## 第一步：选型（不许跳过）

| 用户在说什么 | 类型 | 读者状态 | 标题范式 |
|---|---|---|---|
| 「教我一步步做成这件事」 | Tutorial | 学徒，零判断力，照做即可 | 动词短语：`构建一个…` |
| 「我已经会了，告诉我怎么解决这个具体问题」 | How-to | 有胜任力，只要路线 | **如何**（How to）… |
| 「这个参数 / 元素 / 接口是什么」 | Reference | 带着明确问题来，查到就走 | 名词本身：`用户任务` |
| 「为什么要这样设计 / 两者怎么权衡」 | Explanation | 不在键盘前，在思考 | **关于**… / **为什么**… |

**判别口诀**：能照着执行的 → Tutorial；只需一段路线 → How-to；
只需查一行事实 → Reference；只需想明白一件事 → Explanation。

常见误判（必须修）：

- 教程里塞了架构哲学 → 砍掉，改成一句话 + 指向 Explanation 的链接
- 操作指南里穷举了 API 参数表 → 表移到 Reference，指南里只留链接
- 参考手册里出现「如何配置…」→ 这是 How-to，不是 Reference
- 概念解析里出现可执行步骤或命令 → 这是 How-to，不是 Explanation
- 同一篇既讲「为什么」又讲「怎么做」 → 拆成两篇，互相链接

## 第二步：确定落点

| 类型 | 目录 |
|---|---|
| Tutorial | `src/content/docs/guides/` |
| How-to | `src/content/docs/howto/<领域>/` |
| Reference | `src/content/docs/reference/<体系>/` |
| Explanation | `src/content/docs/bestpractices/` |

`howto/`、`reference/`、`bestpractices/`、`guides/` 在 `astro.config.mjs` 里
**已配置 autogenerate**，新文件放进对应目录后自动出现在侧边栏，不需要改配置。

细则（frontmatter 字段、`sidebar.order`、i18n 目录规则、MDX 组件与 Aside 用法、
链接与数学公式写法）见 [本仓约定](./references/repo-conventions.md)。

各类型的硬规则、骨架与反例见 [四型细则](./references/doc-types.md)。

## 第三步：写

1. 先 `grep` 目标目录，确认没有重复或近似主题的已有文档；有就改旧的，不要新开。
2. 按 `references/doc-types.md` 里对应类型的骨架搭结构，再填内容。
3. 硬规则（会被 linter 拦下的）：
   - 只用该类型允许的内容，四型互相越界即报错
   - 禁止 Emoji、禁止装饰性图片与图标组件充当内容
     （技术示意图例外：BPMN 生命周期、架构图等，用 `/img/x.svg` 或相对 assets 路径）
   - 禁止占位链接（`](url)`）；ASide 之外的组件必须先 import
   - `:::tip` 等 Aside 必须闭合；`<Tabs>` / `<TabItem>` 必须成对
   - Tutorial 禁止分支选项；Explanation 禁止代码块与操作指令
   - How-to 标题以「如何」开头；Explanation 标题以「关于 / 为什么」开头
   - 引用本章其他小节要写成链接（`详见 [7.4 差异对比](#74-差异对比)`），
     **不许留裸编号**「详见 7.4」——读者点不动
4. 泛化占位符一律换成本仓真实路径或真实 slug，不要留 `[Reference Guide](url)`。

### 要多语言版本时

**中文主笔，再逐语言本地化重写**——不逐句对译，也不先写英文。

顺序不是关键，**对着该语言的界面核名词**才是。界面上的词和中文不一样（设计视图 →
Designer / 設計ビュー），从中文直译出来的英文名用户在界面上找不到。术语来源与已核对
的对照表见 [本仓约定 · 多语言](./references/repo-conventions.md)。

三条硬要求：

- 标题按该语言重写，`](#锚点)` 全部重算（锚点由标题自动生成，各语言不同）
- 英文用美式拼写（`color` / `behavior`）
- 写完把三语文件一起丢给 linter：`link/anchor-not-found` 专门接跨语言复制错的锚点

## 第四步：校验（必做）

```bash
# 机械规则检查（四型硬规则子集）
node .github/skills/orion-docs-authoring/scripts/lint-diataxis.mjs src/content/docs/howto/build/project.mdx

# 或者整目录
node .github/skills/orion-docs-authoring/scripts/lint-diataxis.mjs src/content/docs/howto
```

linter 只判**结构与禁用项**，不判内容质量。它报 error 必须修；warn 需逐条判断
（有些是合理例外，但要在回复里说明为什么保留）。

然后跑类型检查与构建，确认 MDX 真的能编译：

```bash
npm run check
npm run build          # 预期 201 页，多一篇就 +1
```

需要目视确认时：

```bash
npx astro dev --background     # 4321 端口
npx astro dev logs             # 看编译错误
npx astro dev stop
```

## 交付时必须说明的四件事

1. 选了哪种类型，为什么（一句话）
2. 文件落在哪个路径，侧边栏会出现在哪个分组
3. linter 结果：几个 error / warn，warn 为什么保留
4. `npm run build` 的页数变化

## 禁止事项

- 不要为了「看起来完整」把四型混进一篇
- 不要在 Reference 里写教学语气，也不要在 Tutorial 里写原理
- 不要新建 `zh-cn/` 这类未声明的语言目录（会把页面变成 404 幽灵路由）
- 不要用 Emoji，也不要用装饰性截图充当内容（技术示意图不算）
- 不要把本 skill 的规则当成「建议」——error 级是硬约束
- 不要改动 `bestpractices/write*.mdx` 四篇规范来迁就自己写的文档

## 参考

- [四型细则：定位、硬规则、骨架、反例](./references/doc-types.md)
- [本仓约定：路径、frontmatter、MDX、i18n、校验](./references/repo-conventions.md)
- [机械检查脚本](./scripts/lint-diataxis.mjs)

## 维护说明

本 skill 是唯一真相，放在 `.github/skills/orion-docs-authoring/`。
`.claude/skills/orion-docs-authoring` 是指向它的一层**软链**，让 Claude Code 也能发现同一份
内容——**不要在那里另写一份**，改一处即可两边生效。

```bash
# 若软链丢失（例如 Windows 检出时符号链接未被保留），重建：
ln -sfn ../../.github/skills/orion-docs-authoring .claude/skills/orion-docs-authoring
```

四篇规范正文（`bestpractices/write*.mdx`）是给人和 linter 的**规则来源**，本 skill 不复制
其全文；两者冲突时以那四篇为准，并回来同步 `references/doc-types.md`。

