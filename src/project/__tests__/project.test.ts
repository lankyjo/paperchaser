import { describe, expect, it } from 'vitest'

import { createProject, projectSchema } from '../project'

describe('createProject', () => {
  it('creates an active project with a trimmed title that round-trips through JSON and the schema', () => {
    const project = createProject({ id: 'p1', title: '  Acme rebrand  ', now: '2026-10-07T10:00:00.000Z' })
    expect(project).toEqual({
      id: 'p1',
      title: 'Acme rebrand',
      state: 'active',
      archived: false,
      createdAt: '2026-10-07T10:00:00.000Z',
      updatedAt: '2026-10-07T10:00:00.000Z',
    })
    expect(projectSchema.parse(JSON.parse(JSON.stringify(project)))).toEqual(project)
  })
})
