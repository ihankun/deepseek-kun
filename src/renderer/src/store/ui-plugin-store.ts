import { create } from 'zustand'
import {
  buildUiPluginTokenCss,
  resolveUiPluginFigure,
  type UiPluginFigureSlot,
  type UiPluginLabelKey,
  type UiPluginListItem,
  type UiPluginManifestV1,
  type UiPluginRuntimeFigures
} from '@shared/ui-plugin'
import {
  UI_MODE_DEFAULT,
  UI_MODE_IKUN,
  UI_MODE_RETROMA,
  readUiModePreference,
  writeUiModePreference
} from '../lib/ui-mode'

/**
 * 形象工坊运行时:单一 uiMode('default' | 'ikun' | 插件 id),
 * 负责 DOM 属性(data-ikun-mode / data-ui-plugin)、token 样式注入与插件图集加载。
 */

export type UiPluginRuntime = {
  manifest: UiPluginManifestV1
  figures: UiPluginRuntimeFigures
}

type UiPluginState = {
  uiMode: string
  installed: UiPluginListItem[]
  activeRuntime: UiPluginRuntime | null
  busy: boolean
  initialized: boolean
  lastError: string | null
  initUiPlugins: () => Promise<void>
  refreshUiPlugins: () => Promise<void>
  activateUiMode: (mode: string) => Promise<void>
  installUiPluginFromDialog: () => Promise<{ ok: boolean; errors?: string[]; canceled?: boolean }>
  removeUiPluginById: (id: string) => Promise<void>
}

const TOKEN_STYLE_ELEMENT_ID = 'ds-ui-plugin-tokens'

function uiPluginApi(): Window['kunGui'] | null {
  if (typeof window === 'undefined') return null
  return window.kunGui ?? null
}

function applyUiModeDom(mode: string, runtime: UiPluginRuntime | null): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-ikun-mode', mode === UI_MODE_IKUN ? 'on' : 'off')
  // Retroma 是纯配色模式:仅点亮 data-retroma-mode(浅色守卫在 CSS 侧),
  // 不走插件运行时,不注入插件 token。
  root.setAttribute('data-retroma-mode', mode === UI_MODE_RETROMA ? 'on' : 'off')
  if (runtime && mode === runtime.manifest.id) {
    root.setAttribute('data-ui-plugin', runtime.manifest.id)
  } else {
    root.removeAttribute('data-ui-plugin')
  }

  const css = runtime && mode === runtime.manifest.id ? buildUiPluginTokenCss(runtime.manifest) : ''
  let styleElement = document.getElementById(TOKEN_STYLE_ELEMENT_ID)
  if (!css) {
    styleElement?.remove()
    return
  }
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = TOKEN_STYLE_ELEMENT_ID
    document.head.appendChild(styleElement)
  }
  styleElement.textContent = css
}

export const useUiPluginStore = create<UiPluginState>((set, get) => ({
  uiMode: UI_MODE_DEFAULT,
  installed: [],
  activeRuntime: null,
  busy: false,
  initialized: false,
  lastError: null,

  initUiPlugins: async () => {
    if (get().initialized) return
    set({ initialized: true, uiMode: UI_MODE_DEFAULT })
    applyUiModeDom(UI_MODE_DEFAULT, null)
  },

  refreshUiPlugins: async () => {
    // disabled
  },

  activateUiMode: async (_mode: string) => {
    // disabled: always fall back to default
    writeUiModePreference(UI_MODE_DEFAULT)
    set({ uiMode: UI_MODE_DEFAULT, activeRuntime: null, lastError: null })
    applyUiModeDom(UI_MODE_DEFAULT, null)
  },

  installUiPluginFromDialog: async () => {
    return { ok: false, canceled: true }
  },

  removeUiPluginById: async (_id: string) => {
    // disabled
  }
}))

/** 按槽位回退链取激活插件的形象;无插件或槽位缺失时返回 fallback */
export function useUiPluginFigure(
  slots: readonly UiPluginFigureSlot[],
  fallback: string
): string {
  const figure = useUiPluginStore((state) =>
    resolveUiPluginFigure(state.activeRuntime?.figures ?? null, slots)
  )
  return figure ?? fallback
}

/** 激活插件提供的进行中文案(按当前语言);未提供时返回 null */
export function useUiPluginWorkLabel(labelKey: UiPluginLabelKey, language: string): string | null {
  return useUiPluginStore((state) => {
    const labels = state.activeRuntime?.manifest.labels
    if (!labels) return null
    const locale = language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
    return labels[locale]?.[labelKey] ?? null
  })
}

/** 是否应启用主会话出没彩蛋(ikun 内置 或 插件声明 features.cameos) */
export function useUiModeCameosEnabled(): boolean {
  return useUiPluginStore(
    (state) =>
      state.uiMode === UI_MODE_IKUN ||
      Boolean(state.activeRuntime && state.activeRuntime.manifest.features?.cameos)
  )
}
