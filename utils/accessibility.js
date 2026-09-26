/**
 * Accessibility checks with axe-core, shared by both runners.
 *
 * Checks WCAG 2.1 A and AA rules plus axe best practices. Returns violations
 * rather than asserting, so each runner can attach the full report and then fail
 * with a readable summary.
 */
const { AxeBuilder } = require('@axe-core/playwright');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

/**
 * @typedef {import('axe-core').Result} Violation
 */

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ exclude?: string[], disableRules?: string[] }} [options]
 *   exclude: CSS selectors to skip (e.g. third-party widgets you don't control)
 *   disableRules: axe rule ids to skip, each with a comment saying why
 * @returns {Promise<Violation[]>}
 */
async function findAccessibilityViolations(page, { exclude = [], disableRules = [] } = {}) {
    let builder = new AxeBuilder({ page }).withTags(TAGS);
    for (const selector of exclude) builder = builder.exclude(selector);
    if (disableRules.length > 0) builder = builder.disableRules(disableRules);
    const { violations } = await builder.analyze();
    return violations;
}

/**
 * One line per violation, with the elements involved, for assertion messages.
 * @param {Violation[]} violations
 */
function formatViolations(violations) {
    return violations
        .map((v) => {
            const targets = v.nodes.map((node) => node.target.join(' ')).join(', ');
            return `[${v.impact}] ${v.id}: ${v.help} (${targets}) ${v.helpUrl}`;
        })
        .join('\n');
}

module.exports = { findAccessibilityViolations, formatViolations, TAGS };
