import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemorySettingsSection } from './settings-section-memory'

const labels: Record<string, string> = {
  sectionMemory: 'Long-term memory',
  memoryEnable: 'Enable memory',
  memoryEnableDesc: 'Enable memory description',
  memoryOverview: 'Overview',
  memoryOverviewDesc: 'Overview description',
  memoryActiveCount: 'Active',
  memoryTombstoneCount: 'Deleted',
  memoryEnabled: 'Status',
  memoryOn: 'On',
  memoryOff: 'Off',
  memoryRecords: 'Memory records',
  memoryRecordsDesc: 'Memory records description',
  memoryDisabledHint: 'Memory disabled',
  memoryScope_all: 'All',
  memoryScope_user: 'User',
  memoryScope_workspace: 'Workspace',
  memoryScope_project: 'Project',
  memoryCreate: 'New',
  memoryCreateTitle: 'Create memory',
  memoryEditTitle: 'Edit memory',
  memoryContentPlaceholder: 'Memory content',
  memoryTagsPlaceholder: 'Tags',
  memoryConfidence: 'Confidence',
  memoryCancel: 'Cancel',
  memorySave: 'Save',
  memoryEmpty: 'No memory records',
  memoryEdit: 'Edit',
  memoryDetails: 'Details',
  memoryClose: 'Close',
  memoryDisable: 'Disable',
  memoryDelete: 'Delete',
  memoryDisabled: 'Disabled',
  memoryProject: 'Project',
  memoryLastInjected: 'Last injected',
  memoryLastInjectedDesc: 'Last injected description'
}

function baseCtx(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    t: (key: string) => labels[key] ?? key,
    kun: { memoryEnabled: true },
    updateKun: () => undefined,
    memoryDiagnostics: {
      enabled: true,
      activeCount: 1,
      tombstoneCount: 0,
      lastInjectedIds: []
    },
    memoryRecords: [],
    createMemoryRecord: async () => true,
    updateMemoryRecord: async () => true,
    disableMemoryRecord: async () => undefined,
    deleteMemoryRecord: async () => undefined,
    ...overrides
  }
}

describe('MemorySettingsSection', () => {
  it('renders a compact list row with tags and the scoped directory', () => {
    const projectPath = '/Users/mothra/data/code/kook-bot'
    const html = renderToStaticMarkup(createElement(MemorySettingsSection, {
      ctx: baseCtx({
        memoryRecords: [
          {
            id: 'mem_mqns1234',
            content: 'Remember the project overview',
            scope: 'project',
            project: projectPath,
            tags: ['project-overview', 'kook-bot'],
            confidence: 1,
            createdAt: '2026-06-21T00:00:00.000Z',
            updatedAt: '2026-06-21T00:00:00.000Z'
          }
        ]
      })
    }))

    expect(html).toContain('Details')
    expect(html).toContain('Project')
    expect(html).toContain(projectPath)
    expect(html).toContain('project-overview')
  })

  it('truncates long memory content in the default list view', () => {
    const hiddenTail = 'this tail should only appear inside the details dialog'
    const content = `${'Long memory content '.repeat(12)}${hiddenTail}`
    const html = renderToStaticMarkup(createElement(MemorySettingsSection, {
      ctx: baseCtx({
        memoryRecords: [
          {
            id: 'mem_long1234',
            content,
            scope: 'workspace',
            workspace: '/Users/mothra/data/code/kook-bot',
            tags: ['summary'],
            confidence: 1,
            createdAt: '2026-06-21T00:00:00.000Z',
            updatedAt: '2026-06-21T00:00:00.000Z'
          }
        ]
      })
    }))

    expect(html).toContain('Long memory content')
    expect(html).not.toContain(hiddenTail)
  })
})
