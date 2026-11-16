/**
 * remark 插件：给正文里所有「站内绝对路径」补上部署 base 前缀。
 *
 * 为什么需要它：Astro 不会自动改写 Markdown / MDX 正文里的 `/xxx` 链接与图片，
 * 站点一旦挂到子路径（如 `/docs/`）下，这些裸路径会跳到域名根部而 404。
 * 侧边栏、上一页/下一页、搜索、favicon 等 Starlight 自产链接是另一条链路，
 * 本来就带 base；frontmatter 里的链接（splash 首页 hero 按钮）不经过 Markdown
 * 管线，由 src/starlightRouteData.ts 路由中间件处理。
 *
 * 覆盖三种写法（remark 阶段的 mdast 都能看到）：
 *   1. Markdown 链接与图片：`[文字](/path)`、`![图](/img/x.png)`、引用式定义 `[x]: /path`
 *   2. MDX 里的静态 JSX 属性：`<script src="/js/scalar.js">`、`data-url="/openapi.json"`
 *   3. `.md` 里的原生 HTML 字符串：`<a href="/path">`
 *
 * 跳过规则：外链（https://…、mailto:…）、锚点（#…）、协议相对链接（//…）
 * 都不以单个 `/` 开头，天然不动；已经带过前缀的值也跳过，处理是幂等的。
 * base 为 `/`（部署到域名根目录）时整个插件是空操作。
 *
 * @param {{ base?: string }} options 部署路径（与 astro.config 的 base 同源）
 * @returns {(tree: unknown) => void} remark transformer
 */
export default function remarkBaseLinks(options = {}) {
  const raw = String(options.base ?? '/');
  const prefix = raw === '/' ? '' : '/' + raw.replace(/^\/+|\/+$/g, '');

  return (tree) => {
    if (!prefix) return;
    walk(tree, prefix);
  };
}

/** JSX 上以这些名字出现、且值是站内路径的属性 */
const URL_ATTRS = new Set(['href', 'src', 'action', 'poster', 'data-url']);

/** 给单个路径值补前缀；不符合站内绝对路径条件的原样返回 */
function withBase(value, prefix) {
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    value !== prefix &&
    !value.startsWith(`${prefix}/`)
  ) {
    return prefix + value;
  }
  return value;
}

function walk(node, prefix) {
  if (!node || typeof node !== 'object') return;

  // 1. Markdown 链接 / 图片 / 引用式定义
  if (
    (node.type === 'link' || node.type === 'image' || node.type === 'definition') &&
    typeof node.url === 'string'
  ) {
    node.url = withBase(node.url, prefix);
  }

  // 2. MDX 静态 JSX 属性（表达式属性值不是字符串，会自动跳过）
  if (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    Array.isArray(node.attributes)
  ) {
    for (const attr of node.attributes) {
      if (
        attr &&
        attr.type === 'mdxJsxAttribute' &&
        URL_ATTRS.has(attr.name) &&
        typeof attr.value === 'string'
      ) {
        attr.value = withBase(attr.value, prefix);
      }
    }
  }

  // 3. `.md` 里的原生 HTML 字符串（只改 href / src / data-url 的静态取值）
  if (node.type === 'html' && typeof node.value === 'string') {
    node.value = node.value.replace(
      /\b(href|src|data-url)=(["'])(\/[^"'\s]*)\2/g,
      (_m, name, quote, url) => `${name}=${quote}${withBase(url, prefix)}${quote}`,
    );
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, prefix);
  }
}
