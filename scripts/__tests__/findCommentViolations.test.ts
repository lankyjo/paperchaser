import { describe, expect, it } from 'vitest'

import { findCommentViolations } from '../findCommentViolations.ts'

describe('findCommentViolations', () => {
  it('flags a block comment that spans more than one line', () => {
    const source = '/**\n * Totals engine.\n */\nexport const x = 1\n'
    expect(findCommentViolations(source)).toEqual([{ line: 1, reason: 'multi-line comment' }])
  })
  it('flags stacked standalone line comments but not trailing comments on consecutive code lines', () => {
    const stacked = '// first line\n// second line\nconst a = 1\n'
    const trailing = 'const a = 1 // one\nconst b = 2 // two\n'
    expect(findCommentViolations(stacked)).toEqual([{ line: 2, reason: 'multi-line comment' }])
    expect(findCommentViolations(trailing)).toEqual([])
  })
  it('flags comments that cite planning artifacts instead of describing code', () => {
    for (const ref of ['D-12', 'T-04-04-LINE-IMAGE', 'ADR 0002', 'PITFALLS.md:232', '02-RESEARCH.md', 'Pitfall 3', 'Phase 6', '04-02-PLAN.md']) {
      expect(findCommentViolations(`const a = 1 // see ${ref}\n`)).toEqual([{ line: 1, reason: 'references a planning artifact' }])
    }
  })

  it('ignores comment-like text inside strings and JSX', () => {
    expect(findCommentViolations('const url = "http://x // D-12"\nconst el = <a>// ADR</a>\n')).toEqual([])
  })
  it('treats lint and type directives as code markers, not prose, so a comment under one is allowed', () => {
    const source = '// eslint-disable-next-line no-console\n// logs the startup banner\nconsole.log(1)\n'
    expect(findCommentViolations(source)).toEqual([])
  })

  it('flags a single-line block comment stacked on a line comment', () => {
    expect(findCommentViolations('/* first */\n// second\nconst a = 1\n')).toEqual([{ line: 2, reason: 'multi-line comment' }])
  })

  it('flags lowercase phase and plan references', () => {
    expect(findCommentViolations('const a = 1 // added in phase 4\n')).toEqual([{ line: 1, reason: 'references a planning artifact' }])
  })
})
