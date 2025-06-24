/**
 * Info Dialog Component
 * Bilgi dialogu
 */

import { createElement, createOverlay, removeElement, on } from '../../core/utils/dom.js';
import { MESSAGES, GIFS } from '../../core/config.js';

export class InfoDialog {
  constructor(options = {}) {
    this.options = {
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
      id: 'info-overlay',
      onClick: (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      }
    });

    this.dialog = createElement('div', {
      className: 'dialog info-dialog',
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
      <img src="${GIFS.INFO}" alt="Info GIF" class="dialog-gif" />
      <p class="dialog-text">${MESSAGES.INFO_MESSAGE}</p>
      <button class="dialog-button heart-button" data-action="close">
        ❤️
      </button>
    `;
  }

  /**
   * Event listeners'ları ayarlar
   */
  setupEventListeners() {
    const heartButton = this.dialog.querySelector('[data-action="close"]');

    if (heartButton) {
      on(heartButton, 'click', () => {
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
