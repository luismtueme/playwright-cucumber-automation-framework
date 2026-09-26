/**
 * Gherkin linter for this framework's conventions, built on the official
 * @cucumber/gherkin parser. Part of `npm run lint`.
 *
 * Rules:
 *   parse-error          the file must be valid Gherkin
 *   unknown-tag          tags must be in ALLOWED_TAGS (or @jira:ABC-123)
 *   quarantine-ticket    @quarantine needs a @jira:ABC-123 tag explaining why
 *   no-scenarios         a feature must contain at least one scenario
 *   duplicate-name       scenario names must be unique within a feature
 *   missing-then         every scenario needs a Then step (it must check something)
 *   outline-examples     outlines need Examples rows, and every <placeholder> needs a column
 *
 * Usage: node utils/lintGherkin.js [files...]   (default: all of features/)
 */
const fs = require('fs');
const path = require('path');
const { AstBuilder, GherkinClassicTokenMatcher, Parser } = require('@cucumber/gherkin');
const { IdGenerator } = require('@cucumber/messages');

/** Add new tags here so they're documented in one place */
const ALLOWED_TAGS = new Set(['@Smoke', '@Regression', '@ui', '@api', '@db', '@authenticated', '@a11y', '@quarantine']);
const JIRA_TAG = /^@jira:[A-Z][A-Z0-9]*-\d+$/;

/**
 * @typedef {{ file: string, line: number, rule: string, message: string }} Problem
 * @typedef {import('@cucumber/messages').Tag} Tag
 */

/**
 * @param {string} file Path shown in messages
 * @param {string} source Feature file contents
 * @returns {Problem[]}
 */
function lintSource(file, source) {
    /** @type {Problem[]} */
    const problems = [];
    const report = (/** @type {number} */ line, /** @type {string} */ rule, /** @type {string} */ message) =>
        problems.push({ file, line, rule, message });

    let document;
    try {
        const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
        document = parser.parse(source);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const line = Number(message.match(/\((\d+):\d+\)/)?.[1] ?? 1);
        report(line, 'parse-error', message.split('\n')[0]);
        return problems;
    }

    const feature = document.feature;
    if (!feature) return problems;

    /** @param {readonly Tag[]} tags */
    const checkTags = (tags) => {
        for (const tag of tags) {
            if (!ALLOWED_TAGS.has(tag.name) && !JIRA_TAG.test(tag.name)) {
                report(
                    tag.location.line,
                    'unknown-tag',
                    `Unknown tag ${tag.name}. Allowed: ${[...ALLOWED_TAGS].join(', ')}, @jira:ABC-123 (see utils/lintGherkin.js)`,
                );
            }
        }
    };
    checkTags(feature.tags);

    const scenarios = feature.children.flatMap((child) => {
        if (child.scenario) return [child.scenario];
        if (child.rule)
            return child.rule.children.flatMap((ruleChild) => (ruleChild.scenario ? [ruleChild.scenario] : []));
        return [];
    });
    if (scenarios.length === 0)
        report(feature.location.line, 'no-scenarios', `Feature "${feature.name}" has no scenarios`);

    const seen = new Map();
    for (const scenario of scenarios) {
        const line = scenario.location.line;
        checkTags(scenario.tags);
        scenario.examples.forEach((examples) => checkTags(examples.tags));

        if (seen.has(scenario.name)) {
            report(
                line,
                'duplicate-name',
                `Scenario name "${scenario.name}" is also used on line ${seen.get(scenario.name)}`,
            );
        } else {
            seen.set(scenario.name, line);
        }

        if (!scenario.steps.some((step) => step.keywordType === 'Outcome')) {
            report(line, 'missing-then', `Scenario "${scenario.name}" has no Then step, so it doesn't check anything`);
        }

        const allTags = [...feature.tags, ...scenario.tags, ...scenario.examples.flatMap((e) => e.tags)].map(
            (t) => t.name,
        );
        if (allTags.includes('@quarantine') && !allTags.some((name) => JIRA_TAG.test(name))) {
            report(line, 'quarantine-ticket', `Quarantined scenario "${scenario.name}" needs a @jira:ABC-123 tag`);
        }

        const placeholders = [scenario.name, ...scenario.steps.map((s) => s.text + (s.docString?.content ?? ''))]
            .join('\n')
            .match(/<[^<>\s]+>/g);
        if (scenario.examples.length > 0 || placeholders) {
            const rows = scenario.examples.reduce((count, examples) => count + examples.tableBody.length, 0);
            if (rows === 0)
                report(line, 'outline-examples', `Scenario Outline "${scenario.name}" has no Examples rows`);
            for (const examples of scenario.examples) {
                const columns = new Set(examples.tableHeader?.cells.map((cell) => cell.value) ?? []);
                for (const placeholder of new Set(placeholders ?? [])) {
                    if (!columns.has(placeholder.slice(1, -1))) {
                        report(
                            examples.location.line,
                            'outline-examples',
                            `Examples table has no "${placeholder.slice(1, -1)}" column for ${placeholder}`,
                        );
                    }
                }
            }
        }
    }
    return problems;
}

/** @param {string} dir @returns {string[]} */
function featureFiles(dir) {
    return fs
        .readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.feature'))
        .map((file) => path.join(dir, file));
}

function main() {
    const files =
        process.argv.length > 2 ? process.argv.slice(2) : featureFiles(path.join(__dirname, '..', 'features'));
    const problems = files.flatMap((file) =>
        lintSource(path.relative(process.cwd(), file), fs.readFileSync(file, 'utf8')),
    );
    for (const { file, line, rule, message } of problems) console.error(`${file}:${line}  ${message}  [${rule}]`);
    if (problems.length > 0) {
        console.error(`\nGherkin lint: ${problems.length} problem(s) in ${files.length} feature file(s)`);
        process.exitCode = 1;
    } else {
        console.log(`Gherkin lint: ${files.length} feature file(s) OK`);
    }
}

module.exports = { lintSource, ALLOWED_TAGS };

if (require.main === module) main();
