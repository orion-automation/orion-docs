#!/usr/bin/env node
/**
 * Diátaxis 机械规则检查（orion-docs）
 *
 * 只检查**可判定**的结构与禁用项，不评价内容质量。规则来源：
 *   src/content/docs/bestpractices/write{tutorial,howto,reference,explanation}.mdx
 *   .github/skills/orion-docs-authoring/references/doc-types.md
 *
 * 用法：
 *   node scripts/lint-diataxis.mjs <文件或目录> [--type tutorial|howto|reference|explanation]
 *                                                  [--strict] [--json] [--quiet]
 * 目录会递归检查 *.mdx / *.md。不传 --type 时按路径推断（howto/ reference/ guides/）。
 * 退出码：有 error → 1；--strict 下 warn 也算失败。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';

// ── 常量 ────────────────────────────────────────────────────────────────
const TYPES = ['tutorial', 'howto', 'reference', 'explanation'];

/** 已声明的语言目录（新增语言要同步改 astro.config 与本表）。 */
const KNOWN_LOCALES = ['root', 'en', 'ja'];

/** 常见的未声明语言目录 —— 出现即视为幽灵路由。 */
const COMMON_LOCALE_DIRS = [
	'zh-cn',
	'zh-CN',
	'zh-tw',
	'zh-TW',
	'en-US',
	'en-us',
	'fr',
	'de',
	'es',
	'ko',
	'ru',
	'pt',
	'it',
	'vi',
	'th',
	'id',
	'tr',
	'ar',
];

/** 允许使用的 Starlight 组件（必须显式 import）。 */
const COMPONENTS = [
	'Aside',
	'Badge',
	'Card',
	'CardGrid',
	'FileTree',
	'Icon',
	'LinkButton',
	'LinkCard',
	'Steps',
	'TabItem',
	'Tabs',
];

const EMOJI = /[\u{1F000}-\u{1FAFF}]/u;
const PLACEHOLDER_LINK = /\]\((?:url|URL|link|链接|待补|TODO)\)/;

/** Explanation 里禁止的代码块语言。 */
const BANNED_FENCE_LANGS = new Set([
	'bash',
	'sh',
	'shell',
	'zsh',
	'console',
	'xml',
	'java',
	'javascript',
	'js',
	'typescript',
	'ts',
	'json',
	'yaml',
	'yml',
	'sql',
	'properties',
	'dockerfile',
	'nginx',
]);

// ── 参数 ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
	const opts = { targets: [], type: null, strict: false, json: false, quiet: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--type') opts.type = argv[++i];
		else if (arg.startsWith('--type=')) opts.type = arg.slice(7);
		else if (arg === '--strict') opts.strict = true;
		else if (arg === '--json') opts.json = true;
		else if (arg === '--quiet') opts.quiet = true;
		else if (arg === '-h' || arg === '--help') opts.help = true;
		else if (arg.startsWith('-')) throw new Error(`未知参数：${arg}`);
		else opts.targets.push(arg);
	}
	return opts;
}

function usage() {
	return [
		'用法：node lint-diataxis.mjs <文件或目录> [选项]',
		'',
		'  --type <tutorial|howto|reference|explanation>  显式指定文档类型',
		'                                                （不传则按路径推断）',
		'  --strict                                      warn 也视为失败',
		'  --json                                        以 JSON 输出',
		'  --quiet                                       只输出问题，不输出统计',
	].join('\n');
}

// ── 文件收集 ────────────────────────────────────────────────────────────
function collectFiles(target) {
	const abs = resolve(target);
	const stat = statSync(abs);
	if (stat.isFile()) return [abs];
	const out = [];
	for (const name of readdirSync(abs)) {
		if (name === 'node_modules' || name === 'dist' || name === '.astro' || name.startsWith('.'))
			continue;
		const child = join(abs, name);
		const childStat = statSync(child);
		if (childStat.isDirectory()) out.push(...collectFiles(child));
		else if (/\.mdx?$/.test(name)) out.push(child);
	}
	return out;
}

function findRepoRoot(start) {
	let dir = resolve(start);
	for (;;) {
		if (existsSync(join(dir, 'astro.config.mjs'))) return dir;
		const parent = resolve(dir, '..');
		if (parent === dir) return null;
		dir = parent;
	}
}

// ── 类型推断 ────────────────────────────────────────────────────────────
function inferType(absPath, repoRoot) {
	const rel = repoRoot ? relative(join(repoRoot, 'src/content/docs'), absPath) : absPath;
	const parts = rel.split(sep);
	const idx = parts.findIndex((p) => ['guides', 'howto', 'reference'].includes(p));
	if (idx === -1) return null;
	if (parts[idx] === 'guides') return 'tutorial';
	if (parts[idx] === 'howto') return 'howto';
	if (parts[idx] === 'reference') return 'reference';
	return null;
}

/** 默认语言（root）没有 URL 前缀，其余按第一段路径判断。 */
function inferLocale(absPath, repoRoot) {
	if (!repoRoot) return 'root';
	const rel = relative(join(repoRoot, 'src/content/docs'), absPath);
	const first = rel.split(sep)[0];
	return KNOWN_LOCALES.includes(first) && first !== 'root' ? first : 'root';
}

// ── 解析 ────────────────────────────────────────────────────────────────
function parseFrontmatter(source) {
	// 允许前导空行（仓内已有文件就是 `\n---\n` 开头）
	const open = source.match(/^\s*---\n/);
	if (!open) return { raw: null, endLine: 0 };
	const start = open[0].length;
	const close = source.indexOf('\n---', start);
	if (close === -1) return { raw: null, endLine: 0 };
	const raw = source.slice(start, close);
	const afterClose = source.indexOf('\n', close + 4);
	const endLine =
		afterClose === -1 ? source.split('\n').length : source.slice(0, afterClose).split('\n').length;
	return { raw, endLine };
}

function frontValue(raw, key) {
	if (!raw) return null;
	const re = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm');
	const m = raw.match(re);
	if (!m) return null;
	return m[1].trim().replace(/^['"]|['"]$/g, '');
}

function buildMasks(lines, frontmatterEndLine) {
	const inFence = new Array(lines.length).fill(false);
	const isFence = new Array(lines.length).fill(false);
	let fence = null;
	for (let i = 0; i < lines.length; i++) {
		const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/);
		if (!fence && m) {
			fence = { char: m[1][0], start: i, lang: (m[2] || '').toLowerCase() };
			inFence[i] = true;
			isFence[i] = true;
			continue;
		}
		if (fence && m && m[1][0] === fence.char) {
			fence.end = i;
			fence = null;
			inFence[i] = true;
			isFence[i] = true;
			continue;
		}
		inFence[i] = Boolean(fence);
	}
	const inFrontmatter = new Array(lines.length).fill(false);
	for (let i = 0; i < Math.min(frontmatterEndLine, lines.length); i++) inFrontmatter[i] = true;
	return { inFence, isFence, inFrontmatter };
}

function collectFences(lines, masks) {
	const fences = [];
	let current = null;
	for (let i = 0; i < lines.length; i++) {
		if (!masks.isFence[i]) continue;
		const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/);
		if (!current && m) {
			current = { start: i, lang: (m[2] || '').toLowerCase(), lines: 0 };
		} else if (current) {
			fences.push({ ...current, length: i - current.start - 1 });
			current = null;
		}
	}
	if (current) fences.push({ ...current, length: lines.length - current.start - 1 });
	return fences;
}

// ── 检查 ────────────────────────────────────────────────────────────────
function lintFile(absPath, repoRoot, forcedType) {
	const source = readFileSync(absPath, 'utf8');
	const rel = repoRoot ? relative(repoRoot, absPath).split(sep).join('/') : absPath;

	// 四篇规范正文含大量「故意写错」的示例，不适用机械规则
	if (/bestpractices\/write(howto|explanation|reference|tutorial)\.mdx$/.test(rel))
		return { absPath, rel, skipped: '规范正文（含故意反例），跳过机械检查', issues: [] };

	const lines = source.split('\n');
	const fm = parseFrontmatter(source);
	const masks = buildMasks(lines, fm.endLine);
	const fences = collectFences(lines, masks);
	const type = forcedType ?? inferType(absPath, repoRoot);
	const locale = inferLocale(absPath, repoRoot);

	/**
	 * 可读的正文行（非 frontmatter、非代码块）。
	 * `bare` 把内联代码抹掉 —— 否则文档里写「使用 `<Tabs>` 组件」会被当成真用了 <Tabs>。
	 */
	const prose = [];
	for (let i = 0; i < lines.length; i++) {
		if (masks.inFrontmatter[i] || masks.inFence[i]) continue;
		prose.push({ n: i + 1, text: lines[i], bare: lines[i].replace(/`[^`]*`/g, ' ') });
	}
	const proseSource = prose.map((p) => p.bare).join('\n');

	/** 所有被 import 进本文件的标识符（不限于 Starlight 包：<Icon> 也可能来自 astro-icon）。 */
	const importedNames = new Set();
	for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]+['"]/g))
		for (const part of m[1].split(',')) {
			const name = part.trim().split(/\s+as\s+/).pop()?.trim();
			if (name) importedNames.add(name);
		}
	for (const m of source.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"][^'"]+['"]/g))
		importedNames.add(m[1]);

	const issues = [];
	const add = (severity, code, message, line) => issues.push({ severity, code, message, line });

	// —— 通用 ——
	const title = frontValue(fm.raw, 'title');
	const description = frontValue(fm.raw, 'description');

	if (!fm.raw) add('error', 'fm/missing', '缺少 YAML frontmatter');
	if (!title) add('error', 'fm/title', 'frontmatter 缺少 title');
	if (!description) add('error', 'fm/description', 'frontmatter 缺少 description');
	else if (description.length > 120)
		add('warn', 'fm/description-length', `description 有 ${description.length} 字，建议 ≤120`);

	for (const { n, text, bare } of prose) {
		if (EMOJI.test(text)) add('error', 'prose/emoji', '禁止 Emoji', n);
		if (PLACEHOLDER_LINK.test(bare))
			add('error', 'link/placeholder', '占位链接 `](url)`：必须换成真实 slug 或 URL', n);
		if (/^\s*<img\b/i.test(text)) add('error', 'prose/img', '禁止 <img>，图片不进正文', n);
		if (/^#\s+\S/.test(text))
			add('info', 'prose/h1', '正文 h1 只在落地页（splash / index）使用，普通文档由 title 渲染', n);
	}

	// Aside 与组件配对
	let asideOpen = 0;
	let asideClose = 0;
	for (const { n, text, bare } of prose) {
		const t = bare.trim();
		if (!t.startsWith(':::')) continue;
		if (t === ':::') asideClose++;
		else asideOpen++;
		if (/:::[a-z]+\[[^\]]*[\u{1F000}-\u{1FAFF}]/u.test(t))
			add('error', 'aside/emoji', 'Aside 标题禁止 Emoji', n);
	}
	if (asideOpen !== asideClose)
		add('error', 'aside/unbalanced', `Aside 未闭合：${asideOpen} 个开启、${asideClose} 个 :::`);

	for (const name of COMPONENTS) {
		const usedLines = prose.filter((p) => new RegExp(`<${name}[\\s/>]`).test(p.bare));
		if (usedLines.length === 0) continue;
		if (!importedNames.has(name))
			add(
				'error',
				'component/not-imported',
				`使用了 <${name}> 但本文件没有 import 该组件`,
				usedLines[0].n,
			);
	}

	for (const name of ['Tabs', 'TabItem']) {
		const opens = (proseSource.match(new RegExp(`<${name}[\\s>]`, 'g')) || []).length;
		const closes = (proseSource.match(new RegExp(`</${name}>`, 'g')) || []).length;
		if (opens !== closes)
			add('error', 'component/unbalanced', `<${name}> 未成对：${opens} 开 / ${closes} 闭`);
	}

	// —— 语言目录 ——
	if (repoRoot) {
		const docsRoot = join(repoRoot, 'src/content/docs');
		if (!absPath.startsWith(docsRoot + sep))
			add('error', 'path/outside', `文件不在 src/content/docs/ 下`);
		else {
			const first = relative(docsRoot, absPath).split(sep)[0];
			if (COMMON_LOCALE_DIRS.includes(first) && !KNOWN_LOCALES.includes(first))
				add(
					'error',
					'path/undeclared-locale',
					`目录 "${first}" 不是 astro.config 里声明的语言（${KNOWN_LOCALES.join(' / ')}）` +
						`，会产生 404 幽灵路由`,
				);
		}
	}

	if (!type) {
		// 落点页（index / splash / bestpractices 随笔）本来就不属于四型目录，
		// 全站跑时不该刷成 warn；显式 --type 仍会走完整检查。
		add('info', 'type/unknown', '无法从路径推断文档类型，已跳过类型专属检查（可传 --type）');
		return { absPath, rel, type: null, locale, issues };
	}

	// —— 类型专属 ——
	const head = (text) => prose.filter((p) => new RegExp(`^#{1,6}\\s+.*${text}`).test(p.bare));
	const anyLine = (re) => prose.filter((p) => re.test(p.bare));

	switch (type) {
		case 'tutorial': {
			for (const { n } of anyLine(/你也可以|任选其一|二选一|任选/))
				add('error', 'tutorial/choice', 'Tutorial 禁止分支选项（必须给唯一确定的成功路径）', n);
			for (const { n } of anyLine(/或者/))
				add('warn', 'tutorial/alternative', '「或者」暗示分支，Tutorial 里确认是否必要', n);
			for (const { n } of anyLine(/你将学到|你将学会/))
				add('error', 'tutorial/presumptuous', '禁止「你将学到」句式，改用「我们将共同构建出…」', n);
			if (anyLine(/我们/).length === 0)
				add('warn', 'tutorial/first-person', 'Tutorial 应使用第一人称复数「我们」，全文未出现');
			const stepHeads = head('步骤');
			if (stepHeads.length > 0 && anyLine(/预期/).length === 0)
				add('warn', 'tutorial/feedback', `有 ${stepHeads.length} 个步骤标题但没有任何「预期反馈」`, stepHeads[0].n);
			break;
		}

		case 'howto': {
			if (title) {
				if (locale === 'root' && !title.startsWith('如何'))
					add('warn', 'howto/title', `How-to 标题应以「如何」开头，当前：${title}`);
				if (locale === 'en' && !/^how to\b/i.test(title))
					add('warn', 'howto/title', `How-to title should start with "How to", got: ${title}`);
			}
			for (const { n } of anyLine(/本节将(介绍|讲解|说明)/))
				add('error', 'howto/teaching', 'How-to 拒绝教学：删除「本节将介绍…」', n);
			for (const { n } of anyLine(/原理是|总的来说|总之|什么是/))
				add('warn', 'howto/explanation', '疑似解释性内容，How-to 只给行动指令', n);
			if (anyLine(/前置条件|先决条件|前提|Prerequisites/i).length === 0)
				add('warn', 'howto/prerequisites', '缺少「前置条件」小节');
			break;
		}

		case 'reference': {
			for (const { n, text, bare } of prose) {
				if (/^#{1,6}\s/.test(text) && /如何|怎么/.test(bare))
					add('error', 'reference/instructional-heading', 'Reference 标题不得是「如何…」，那是 How-to', n);
			}
			for (const { n } of anyLine(/为什么|这是因为|想象一下|举个例子/))
				add('warn', 'reference/explanation', 'Reference 只陈述事实，解释性内容移到 Explanation', n);
			for (const { n } of anyLine(/点击|输入命令|执行以下/))
				add('warn', 'reference/action', 'Reference 不含操作动作，移到 How-to', n);
			const hasTable = prose.some((p) => /^\s*\|.*\|\s*$/.test(p.text));
			const hasFieldList = prose.some((p) => /^\s*[*-]\s+\*\*[^*]+\*\*/.test(p.text));
			if (!hasTable && !hasFieldList)
				add('warn', 'reference/no-spec', '既无表格也无字段列表，可能不是 Reference');
			break;
		}

		case 'explanation': {
			for (const fence of fences) {
				if (BANNED_FENCE_LANGS.has(fence.lang))
					add('error', 'explanation/code', `Explanation 禁止代码块（\`\`\`${fence.lang}）`, fence.start + 1);
				else if (fence.length > 8)
					add('warn', 'explanation/code-long', `代码块 ${fence.length} 行，Explanation 只允许极简引用`, fence.start + 1);
			}
			for (const { n } of anyLine(/点击|输入命令|执行以下命令|第一步/))
				add('error', 'explanation/action', 'Explanation 禁止操作指令', n);
			if (title) {
				if (locale === 'root' && !/^(关于|为什么)/.test(title))
					add('warn', 'explanation/title', `Explanation 标题宜以「关于/为什么」开头，当前：${title}`);
				if (locale === 'en' && !/^(about|why)\b/i.test(title))
					add('warn', 'explanation/title', `Explanation title should start with "About"/"Why", got: ${title}`);
			}
			if (anyLine(/权衡|取舍|替代|对比|trade-?off/i).length === 0)
				add('warn', 'explanation/tradeoff', '未讨论权衡或替代方案，Explanation 的核心是设计决策');
			break;
		}
	}

	return { absPath, rel, type, locale, issues };
}

// ── 输出 ────────────────────────────────────────────────────────────────
const COLORS = process.stdout.isTTY
	? { error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', dim: '\x1b[2m', reset: '\x1b[0m' }
	: { error: '', warn: '', info: '', dim: '', reset: '' };

const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 };

function main() {
	let opts;
	try {
		opts = parseArgs(process.argv.slice(2));
	} catch (err) {
		console.error(err.message);
		console.error(usage());
		process.exitCode = 2;
		return;
	}

	if (opts.help || opts.targets.length === 0) {
		console.log(usage());
		process.exitCode = opts.help ? 0 : 2;
		return;
	}

	if (opts.type && !TYPES.includes(opts.type)) {
		console.error(`--type 必须是 ${TYPES.join(' | ')}`);
		process.exitCode = 2;
		return;
	}

	const repoRoot = findRepoRoot(opts.targets[0]) ?? findRepoRoot(process.cwd());
	let files;
	try {
		files = opts.targets.flatMap((t) => collectFiles(t));
	} catch (err) {
		// 路径写错时给一句人话，不要把栈糊到 agent 脸上
		console.error(`路径不存在或不可读：${err.path ?? err.message}`);
		console.error(usage());
		process.exitCode = 2;
		return;
	}
	if (files.length === 0) {
		console.error('没有找到可检查的 .md / .mdx 文件');
		process.exitCode = 2;
		return;
	}

	const results = files.map((f) => lintFile(f, repoRoot, opts.type));

	if (opts.json) {
		console.log(JSON.stringify(results, null, 2));
	} else {
		for (const result of results) {
			const rel = result.rel ?? (repoRoot ? relative(repoRoot, result.absPath) : result.absPath);
			if (result.skipped) {
				if (!opts.quiet) console.log(`${COLORS.dim}skip${COLORS.reset}  ${rel}  ${result.skipped}`);
				continue;
			}
			if (result.issues.length === 0) {
				if (!opts.quiet) console.log(`${COLORS.dim}ok${COLORS.reset}  ${rel}`);
				continue;
			}
			const sorted = [...result.issues].sort(
				(a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.line ?? 0) - (b.line ?? 0),
			);
			console.log(`\n${rel}  ${COLORS.dim}[${result.type ?? '未定类型'} / ${result.locale}]${COLORS.reset}`);
			for (const issue of sorted) {
				const color = COLORS[issue.severity];
				const where = issue.line ? `:${issue.line}` : '';
				console.log(`  ${color}${issue.severity.padEnd(5)}${COLORS.reset} ${issue.code}${where}  ${issue.message}`);
			}
		}
	}

	const all = results.flatMap((r) => r.issues);
	const errors = all.filter((i) => i.severity === 'error').length;
	const warnings = all.filter((i) => i.severity === 'warn').length;
	const infos = all.filter((i) => i.severity === 'info').length;

	if (!opts.json && !opts.quiet) {
		console.log(
			`\n${results.length} 个文件：${errors} error / ${warnings} warn / ${infos} info`,
		);
	}

	if (errors > 0 || (opts.strict && warnings > 0)) process.exitCode = 1;
}

main();
