// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'
import mermaid from 'astro-mermaid';

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
                    label: '操作指南',
                    translations: {
                        root: '操作指南',
                        en: 'How-to',
                        ja: '操作ガイド'
                    },
                    collapsed: true,
                    items: [{ autogenerate: { directory: 'howto' } }],
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
                            slug: 'reference/api' // 指向 src/content/docs/reference/api.mdx
                        },
                        // 2. 手动定义 bpmn 目录，并为其配置多语言
                        {
                            label: 'BPMN',
                            translations: {
                                root: 'BPMN 核心规范',
                                en: 'BPMN',
                                ja: 'BPMN 仕様'
                            },
                            collapsed: true,
                            // 在这里自动生成 bpmn 文件夹下的内容
                            items: [{ autogenerate: { directory: 'reference/bpmn', collapsed: true } }]
                        },
                        // 3. 手动定义 connector 目录
                        {
                            label: 'Connector',
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
});