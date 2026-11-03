export type Lang = 'id' | 'en'

const LANG_KEY = 'wasmtex_lang'

export function getLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'id') return saved
    return 'id' // Default Bahasa Indonesia
  } catch {
    return 'id'
  }
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // Ignore storage errors
  }
}

export function toggleLang(): Lang {
  const next = getLang() === 'id' ? 'en' : 'id'
  setLang(next)
  return next
}

export const t = (idText: string, enText: string, currentLang?: Lang): string => {
  const l = currentLang || getLang()
  return l === 'en' ? enText : idText
}
