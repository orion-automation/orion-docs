// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import starlight from '@astrojs/starlight';
import starlightThemeRapide from 'starlight-theme-rapide'

// https://astro.build/config
export default defineConfig({
    site: 'https://stargazers.club',
    integrations: [
        icon(),
        starlight({
            plugins: [starlightThemeRapide()],
            logo: {
                src: './src/assets/orionlogo.svg',
                replacesTitle: true,
            },
            title: 'ORION Automation',
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
                    label: 'Guides',
                    translations: {
                        root: '快速指南',
                        ja: 'クイックガイド'
                    },
                    items: [
                        // Each item here is one entry in the navigation menu.
                        { 
                            label: 'Example Guide', 
                            translations: { root: '示例指南', ja: 'サンプルガイド' },
                            slug: 'guides/example' 
                        },
                    ],
                },
                {
                    label: 'How-to',
                    translations: {
                        root: '操作指南',
                        ja: '操作ガイド'
                    },
                    items: [{ autogenerate: { directory: 'howto' } }],
                },
                {
                    label: 'Reference',
                    translations: {
                        root: '核心参考',
                        ja: 'リファレンス'
                    },
                    items: [{ autogenerate: { directory: 'reference' } }],
                },
            ],
        }),
    ],
});