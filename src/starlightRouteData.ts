import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Starlight 路由数据中间件：给 frontmatter 里的站内链接补部署 base 前缀。
 *
 * 典型场景：splash 首页 hero 操作按钮的 `link: /reference/bpmn/` —— 这类链接
 * 写在 frontmatter 里、由 Starlight 的 Hero 组件直接渲染，不经过 Markdown 管线，
 * 正文用的 rehype-base-links 插件管不到它，不补前缀在子路径部署下会 404。
 *
 * 只处理以单个 `/` 开头的字符串；外链（https://…、mailto:…）与锚点跳过；
 * base 为 `/`（根目录部署）时是空操作；已带前缀的值跳过，保持幂等。
 */
export const onRequest = defineRouteMiddleware((context, next) => {
  const rawBase = import.meta.env.BASE_URL ?? '/';
  const prefix = rawBase === '/' ? '' : rawBase.replace(/\/+$/, '');

  if (prefix) {
    const hero = context.locals.starlightRoute?.entry?.data?.hero;
    for (const action of hero?.actions ?? []) {
      const link = action.link;
      if (
        typeof link === 'string' &&
        link.startsWith('/') &&
        !link.startsWith('//') &&
        !link.startsWith(`${prefix}/`)
      ) {
        action.link = prefix + link;
      }
    }
  }

  return next();
});
