import { t } from './i18n'

export interface TacticalPromptOptions {
  title?: string
  specTag?: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  multiline?: boolean
  inputLabel?: string
}

export interface TacticalConfirmOptions {
  title?: string
  specTag?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export interface TacticalAlertOptions {
  title?: string
  specTag?: string
  message: string
  btnText?: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Tactical Brutalist Modal Prompt (replaces window.prompt)
 */
export function tacticalPrompt(options: TacticalPromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'arxiv-modal-overlay'
    overlay.style.zIndex = '20000'

    const title = options.title ?? t('Masukkan Data', 'Input Required')
    const specTag = options.specTag ?? t('INPUT DATA // PROMPT', 'PROMPT // REQUIRED INPUT')
    const confirmLabel = options.confirmText ?? t('LANJUTKAN', 'CONFIRM')
    const cancelLabel = options.cancelText ?? t('BATAL', 'CANCEL')
    const defaultVal = options.defaultValue ?? ''
    const placeholder = options.placeholder ?? ''

    overlay.innerHTML = `
      <div class="tactical-modal-frame" style="max-width: 520px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.8);">
        <span class="bracket-corner tl"></span>
        <span class="bracket-corner tr"></span>
        <span class="bracket-corner bl"></span>
        <span class="bracket-corner br"></span>
        <div class="tactical-modal-header">
          <span class="modal-spec-tag">[ ${escapeHtml(specTag)} ]</span>
          <button type="button" class="modal-close-x" id="tac-dialog-close" title="${t('Tutup', 'Close')}">✕</button>
        </div>
        <div class="tactical-modal-body">
          <h3 style="margin: 0; font-family: var(--font-serif); font-size: 19px; color: var(--text-primary); font-weight: 700;">
            ${escapeHtml(title)}
          </h3>
          <p style="margin: 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.5;">
            ${escapeHtml(options.message)}
          </p>
          <div class="form-field-group" style="margin-top: 4px;">
            ${
              options.inputLabel
                ? `<label class="form-field-label" style="font-family: var(--font-mono); font-size: 10.5px; font-weight:700; color: var(--text-muted); display: block; margin-bottom: 6px;">${escapeHtml(options.inputLabel)}</label>`
                : ''
            }
            ${
              options.multiline
                ? `<textarea id="tac-input" class="tactical-form-input" rows="4" placeholder="${escapeHtml(placeholder)}" style="width: 100%; font-family: var(--font-mono); font-size: 13px;"></textarea>`
                : `<input type="text" id="tac-input" class="tactical-form-input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(defaultVal)}" style="width: 100%; font-family: var(--font-mono); font-size: 13px;" />`
            }
          </div>
          <div class="form-actions-row" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button type="button" class="tactical-btn-action" id="tac-cancel-btn">
              ${escapeHtml(cancelLabel)}
            </button>
            <button type="button" class="tactical-cta-btn cta-orange" id="tac-confirm-btn" style="padding: 8px 18px;">
              <span class="cta-inner">${escapeHtml(confirmLabel)}</span>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const input = overlay.querySelector('#tac-input') as HTMLInputElement | HTMLTextAreaElement
    const confirmBtn = overlay.querySelector('#tac-confirm-btn') as HTMLButtonElement
    const cancelBtn = overlay.querySelector('#tac-cancel-btn') as HTMLButtonElement
    const closeBtn = overlay.querySelector('#tac-dialog-close') as HTMLButtonElement

    input?.focus()
    if (input instanceof HTMLInputElement && defaultVal) {
      input.select()
    }

    const cleanup = (value: string | null) => {
      overlay.remove()
      resolve(value)
    }

    confirmBtn?.addEventListener('click', () => cleanup(input.value))
    cancelBtn?.addEventListener('click', () => cleanup(null))
    closeBtn?.addEventListener('click', () => cleanup(null))

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null)
    })

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cleanup(null)
      } else if (e.key === 'Enter' && !options.multiline) {
        e.preventDefault()
        cleanup(input.value)
      }
    })
  })
}

/**
 * Tactical Brutalist Modal Confirm (replaces window.confirm)
 */
export function tacticalConfirm(options: TacticalConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'arxiv-modal-overlay'
    overlay.style.zIndex = '20000'

    const title = options.title ?? t('Konfirmasi Tindakan', 'Confirm Action')
    const specTag = options.specTag ?? t('VERIFIKASI // CONFIRMATION', 'VERIFICATION // CONFIRMATION')
    const confirmLabel = options.confirmText ?? t('YA, LANJUTKAN', 'YES, PROCEED')
    const cancelLabel = options.cancelText ?? t('BATAL', 'CANCEL')
    const btnClass = options.danger ? 'cta-orange' : 'cta-blue'

    overlay.innerHTML = `
      <div class="tactical-modal-frame" style="max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.8);">
        <span class="bracket-corner tl"></span>
        <span class="bracket-corner tr"></span>
        <span class="bracket-corner bl"></span>
        <span class="bracket-corner br"></span>
        <div class="tactical-modal-header">
          <span class="modal-spec-tag">[ ${escapeHtml(specTag)} ]</span>
          <button type="button" class="modal-close-x" id="tac-dialog-close" title="${t('Tutup', 'Close')}">✕</button>
        </div>
        <div class="tactical-modal-body">
          <h3 style="margin: 0; font-family: var(--font-serif); font-size: 19px; color: var(--text-primary); font-weight: 700;">
            ${escapeHtml(title)}
          </h3>
          <p style="margin: 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.55;">
            ${escapeHtml(options.message)}
          </p>
          <div class="form-actions-row" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" class="tactical-btn-action" id="tac-cancel-btn">
              ${escapeHtml(cancelLabel)}
            </button>
            <button type="button" class="tactical-cta-btn ${btnClass}" id="tac-confirm-btn" style="padding: 8px 18px;">
              <span class="cta-inner">${escapeHtml(confirmLabel)}</span>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const confirmBtn = overlay.querySelector('#tac-confirm-btn') as HTMLButtonElement
    const cancelBtn = overlay.querySelector('#tac-cancel-btn') as HTMLButtonElement
    const closeBtn = overlay.querySelector('#tac-dialog-close') as HTMLButtonElement

    confirmBtn?.focus()

    const cleanup = (confirmed: boolean) => {
      overlay.remove()
      resolve(confirmed)
    }

    confirmBtn?.addEventListener('click', () => cleanup(true))
    cancelBtn?.addEventListener('click', () => cleanup(false))
    closeBtn?.addEventListener('click', () => cleanup(false))

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false)
    })

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cleanup(false)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        cleanup(true)
      }
    })
  })
}

/**
 * Tactical Brutalist Modal Alert (replaces window.alert)
 */
export function tacticalAlert(options: TacticalAlertOptions | string): Promise<void> {
  const opts: TacticalAlertOptions =
    typeof options === 'string'
      ? { message: options }
      : options

  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'arxiv-modal-overlay'
    overlay.style.zIndex = '20000'

    const title = opts.title ?? t('Pemberitahuan Sistem', 'System Notice')
    const specTag = opts.specTag ?? t('INFORMASI // NOTICE', 'INFORMATION // NOTICE')
    const btnText = opts.btnText ?? t('MENGERTI', 'UNDERSTOOD')

    let iconBadge = 'ℹ️'
    if (opts.type === 'success') iconBadge = '✓'
    else if (opts.type === 'error') iconBadge = '✕'
    else if (opts.type === 'warning') iconBadge = '⚠'

    overlay.innerHTML = `
      <div class="tactical-modal-frame" style="max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.8);">
        <span class="bracket-corner tl"></span>
        <span class="bracket-corner tr"></span>
        <span class="bracket-corner bl"></span>
        <span class="bracket-corner br"></span>
        <div class="tactical-modal-header">
          <span class="modal-spec-tag">[ ${escapeHtml(specTag)} ]</span>
          <button type="button" class="modal-close-x" id="tac-dialog-close" title="${t('Tutup', 'Close')}">✕</button>
        </div>
        <div class="tactical-modal-body">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 20px; line-height: 1;">${iconBadge}</div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 6px; font-family: var(--font-serif); font-size: 18px; color: var(--text-primary); font-weight: 700;">
                ${escapeHtml(title)}
              </h3>
              <p style="margin: 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.55;">
                ${escapeHtml(opts.message)}
              </p>
            </div>
          </div>
          <div class="form-actions-row" style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button type="button" class="tactical-cta-btn cta-orange" id="tac-confirm-btn" style="padding: 8px 20px;">
              <span class="cta-inner">${escapeHtml(btnText)}</span>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const confirmBtn = overlay.querySelector('#tac-confirm-btn') as HTMLButtonElement
    const closeBtn = overlay.querySelector('#tac-dialog-close') as HTMLButtonElement

    confirmBtn?.focus()

    const cleanup = () => {
      overlay.remove()
      resolve()
    }

    confirmBtn?.addEventListener('click', cleanup)
    closeBtn?.addEventListener('click', cleanup)

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup()
    })

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        cleanup()
      }
    })
  })
}
