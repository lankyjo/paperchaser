import { parseSync } from 'oxc-parser'

export interface CommentViolation {
  line: number
  reason: string
}

const PLANNING_REFERENCE = /\b(D-\d+|T-\d+[\w-]*|ADR|PITFALLS|RESEARCH|[Pp]itfall \d+|[Pp]hase \d+|[Pp]lan \d+|[\w-]+-PLAN\.md)\b/
const DIRECTIVE = /^\s*(eslint|oxlint|@ts-|prettier-ignore)/

export function findCommentViolations(source: string, fileName = 'file.tsx'): CommentViolation[] {
  const { comments } = parseSync(fileName, source)
  const lineOf = (offset: number) => source.slice(0, offset).split('\n').length
  const isAloneOnLine = (offset: number) => source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset).trim() === ''
  const violations: CommentViolation[] = []
  let previousStandaloneLine = -1
  for (const comment of comments) {
    const line = lineOf(comment.start)
    const isSingleLine = lineOf(comment.end) === line
    if (!isSingleLine) violations.push({ line, reason: 'multi-line comment' })
    if (PLANNING_REFERENCE.test(comment.value)) violations.push({ line, reason: 'references a planning artifact' })
    if (isSingleLine && isAloneOnLine(comment.start) && !DIRECTIVE.test(comment.value)) {
      if (line === previousStandaloneLine + 1) violations.push({ line, reason: 'multi-line comment' })
      previousStandaloneLine = line
    }
  }
  return violations
}

// CLI: `node scripts/findCommentViolations.ts` checks every source file and exits non-zero on violations.
if (import.meta.main) {
  const { globSync, readFileSync } = await import('node:fs')
  const files = globSync(['{src,scripts,tests}/**/*.{ts,tsx}', '*.ts'])
  const report = files.flatMap((file) =>
    findCommentViolations(readFileSync(file, 'utf8'), file).map((v) => `${file}:${v.line} ${v.reason}`),
  )
  report.forEach((line) => console.error(line))
  console.error(`${report.length} comment violation(s) in ${files.length} files`)
  process.exitCode = report.length > 0 ? 1 : 0
}
