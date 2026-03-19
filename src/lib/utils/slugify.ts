/**
 * Converts a string to a URL-safe slug / HTML anchor ID.
 *
 * Rules match the heading ID algorithm used by remark-gfm so that
 * `/#anchor` navigation works without a separate mapping table:
 *   - Lowercase
 *   - Replace non-alphanumeric characters with hyphens
 *   - Collapse consecutive hyphens
 *   - Strip leading and trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
