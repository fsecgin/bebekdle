/**
 * Hint Dialog Component
 * İpucu dialogu
 */

import { createElement, createOverlay, removeElement, on } from '../../core/utils/dom.js';
import { MESSAGES, GIFS } from '../../core/config.js';

export class HintDialog {
  constructor(options = {}) {
    this.options = {
      onRevealHint: null,
      onClose: null,
      ...options
    };
    
    this.overlay = null;
    this.dialog = null;
  }

  /**
   * Dialogu gösterir
   */
  show() {
    this.create();
    document.body.appendChild(this.overlay);
  }

  /**
   * Dialog elementlerini oluşturur
   */
  create() {
    this.overlay = createOverlay({
      id: 'hint-overlay',
      onClick: (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      }
    });

    this.dialog = createElement('div', {
      className: 'dialog hint-dialog',
      innerHTML: this.getDialogHTML()
    });

    this.overlay.appendChild(this.dialog);
    this.setupEventListeners();
  }

  /**
   * Dialog HTML içeriğini döndürür
   * @returns {string} - HTML içerik
   */
  getDialogHTML() {
    return `
      <img src="${GIFS.HINT}" alt="Hint GIF" class="dialog-gif" />
      <p class="dialog-text">${MESSAGES.HINT_MESSAGE}</p>
      <div class="dialog-buttons">
        <button class="dialog-button reveal-button" data-action="reveal">
          HARF ALAYIM
        </button>
        <button class="dialog-button close-button" data-action="close">
          KENDİM ÇÖZERİM BE
        </button>
      </div>
    `;
  }

  /**
   * Event listeners'ları ayarlar
   */
  setupEventListeners() {
    const revealButton = this.dialog.querySelector('[data-action="reveal"]');
    const closeButton = this.dialog.querySelector('[data-action="close"]');

    if (revealButton) {
      on(revealButton, 'click', () => {
        if (this.options.onRevealHint) {
          this.options.onRevealHint();
        }
        this.hide();
      });
    }

    if (closeButton) {
      on(closeButton, 'click', () => {
        if (this.options.onClose) {
          this.options.onClose();
        }
        this.hide();
      });
    }
  }

  /**
   * Dialogu gizler
   */
  hide() {
    if (this.overlay) {
      removeElement(this.overlay);
      this.overlay = null;
      this.dialog = null;
    }
  }

  /**
   * Dialog'u yok eder
   */
  destroy() {
    this.hide();
  }
}
