## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Writing docs

Content docs follow the Diátaxis four types (Tutorial / How-to / Reference / Explanation).
Before writing, read `.github/skills/orion-docs-authoring/SKILL.md` — it holds the type-selection
matrix, target directories, hard rules, and the pitfalls (e.g. never create an undeclared locale
directory such as `zh-cn/`, it produces 404 ghost routes).

After writing, run the mechanical rule check:

```
npm run docs:lint src/content/docs/howto/design/project.mdx
```

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
