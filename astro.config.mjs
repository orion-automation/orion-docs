// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'
import mermaid from 'astro-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
    site: 'https://stargazers.club',
    integrations: [
        icon(),
        mermaid({
            autoTheme: true
        }),
        starlight({
            plugins: [starlightThemeRapide()],
            logo: {
                src: './src/assets/orionlogo.svg',
                replacesTitle: true,
            },
            title: 'ORION Automation',
            head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
          },
        },
      ],
            lastUpdated: true,
            defaultLocale: 'root',
            locales: {
                root: { label: '中文', lang: 'zh-CN' },
                'en': { label: 'English', lang: 'en' },
                ja: { label: '日本語', lang: 'ja' },
            },
            components: {
                Footer: './src/components/customFooter.astro',
            },
            customCss: ['./src/styles/custom.css'],
            social: [
                { icon: 'rocket', label: 'ORION', href: 'https://oriorion.com' },
                { icon: 'github', label: 'GitHub', href: 'https://github.com/orion-automation' }],
            sidebar: [
                {
                    label: '快速开始',
                    translations: {
                        root: '快速开始',
                        ja: 'クイックスタート',
                        en: 'Quick Start'
                    },
                    collapsed: true,
                    items: [{ autogenerate: { directory: 'guides' } }],
                },
                {
                    label: '操作指南',
                    translations: {
                        root: '操作指南',
                        en: 'How-to',
                        ja: '操作ガイド'
                    },
                    collapsed: true,
                    items: [
                        {
                            label: '设计中心',
                            translations: {
                                root: '设计中心',
                                en: 'Design Center',
                                ja: '設計センター'
                            },
                            collapsed: true,
                            // 在这里自动生成 bpmn 文件夹下的内容
                            items: [{ autogenerate: { directory: 'howto/design', collapsed: true } }]
                        },
                    ],
                },
                {
                    label: '技术参考',
                    translations: {
                        root: '技术参考',
                        en: 'Reference',
                        ja: 'リファレンス'
                    },
                    collapsed: true,
                    items: [
                        {
                            label: 'REST API参考',
                            translations: {
                                root: 'REST API参考',
                                en: 'REST API Reference',
                                ja: 'REST API リファレンス'
                            },
                            slug: 'reference/api',
                            attrs: {
                                target: '_blank',
                                rel: 'noopener noreferrer' // 安全最佳实践，防止新窗口获取原窗口的引用
                            } // 指向 src/content/docs/reference/api.mdx
                        },
                        // 2. 手动定义 bpmn 目录，并为其配置多语言
                       // 2. 手动定义 bpmn 目录，并为其配置多语言与子文件夹扩展
                        {
                            label: 'BPMN',
                            translations: {
                                root: 'BPMN 核心规范',
                                en: 'BPMN',
                                ja: 'BPMN 仕様'
                            },
                            collapsed: true,
                            items: [
                                // 注意：如果 reference/bpmn 目录下有概览文档（如 index.mdx），可以放一记在最上方
                                // { label: 'BPMN 概述', slug: 'reference/bpmn' },
                                {
                                    label: '事件',
                                    translations: {
                                        root: '事件 (Events)',
                                        en: 'Events',
                                        ja: 'イベント'
                                    },
                                    collapsed: true,
                                    items: [{ autogenerate: { directory: 'reference/bpmn/events', collapsed: true } }]
                                },
                                {
                                    label: '任务',
                                    translations: {
                                        root: '任务 (Tasks)',
                                        en: 'Tasks',
                                        ja: 'タスク'
                                    },
                                    collapsed: true,
                                    items: [{ autogenerate: { directory: 'reference/bpmn/task', collapsed: true } }]
                                },
                                {
                                    label: '子流程',
                                    translations: {
                                        root: '子流程 (Subprocesses)',
                                        en: 'Subprocesses',
                                        ja: 'サブプロセス'
                                    },
                                    collapsed: true,
                                    items: [{ autogenerate: { directory: 'reference/bpmn/subprocess', collapsed: true } }]
                                },
                                {
                                    label: '网关',
                                    translations: {
                                        root: '网关 (Gateways)',
                                        en: 'Gateways',
                                        ja: 'ゲートウェイ'
                                    },
                                    collapsed: true,
                                    items: [{ autogenerate: { directory: 'reference/bpmn/gateway', collapsed: true } }]
                                }
                            ]
                        },
                        // 3. 手动定义 connector 目录
                        {
                            label: '连接器',
                            translations: {
                                root: '连接器',
                                en: 'Connector',
                                ja: 'コネクタ'
                            },
                            collapsed: true,
                            items: [{ autogenerate: { directory: 'reference/connector', collapsed: true } }]
                        },
                        // 4. 手动定义 spin 目录
                        {
                            label: 'SPIN',
                            translations: {
                                root: '数据处理 (SPIN)',
                                en: 'Data Handling (SPIN)',
                                ja: 'データ処理 (SPIN)'
                            },
                            collapsed: true,
                            items: [{ autogenerate: { directory: 'reference/spin', collapsed: true } }]
                        }
                    ],
                },
                {
                    label: '最佳实践',
                    translations: {
                        root: '最佳实践',
                        ja: 'ベストプラクティス',
                        en: 'Best Practices'
                    },
                    collapsed: true,
                    items: [{ autogenerate: { directory: 'bestpractices' } }],
                },
            ],
        }),
    ],
    markdown: {
    // 开启数学公式解析
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});