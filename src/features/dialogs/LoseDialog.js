/**
 * Lose Dialog Component
 * Kaybetme dialogu
 */

import { createElement, createOverlay, removeElement, on } from '../../core/utils/dom.js';
import { MESSAGES, GIFS } from '../../core/config.js';
import { getTimeUntilNextRound, formatTimeRemaining } from '../../core/utils/time.js';

export class LoseDialog {
  constructor(options = {}) {
    this.options = {
      correctWord: '',
      ...options
    };
    
    this.overlay = null;
    this.dialog = null;
    this.countdownInterval = null;
  }

  /**
   * Dialogu gösterir
   */
  show() {
    this.create();
    document.body.appendChild(this.overlay);
    this.startCountdown();
  }

  /**
   * Dialog elementlerini oluşturur
   */
  create() {
    this.overlay = createOverlay({
      id: 'lose-overlay',
      onClick: (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      }
    });

    this.dialog = createElement('div', {
      className: 'dialog lose-dialog',
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
      <img src="${GIFS.LOSE}" alt="Lose GIF" class="dialog-gif" />
      <div class="lose-text-container">
        <p class="dialog-text">${MESSAGES.LOSE_MESSAGE.MAIN}</p>
        <p class="answer-text">${MESSAGES.LOSE_MESSAGE.ANSWER(this.options.correctWord)}</p>
        <p class="dialog-text">${MESSAGES.LOSE_MESSAGE.FINAL}</p>
      </div>
      <div class="countdown-container">
        <div class="countdown-display">00:00:00</div>
        <div class="countdown-label">${MESSAGES.SHARE.NEXT_ROUND}</div>
      </div>
      <button class="dialog-button close-button" data-action="close">
        😾
      </button>
    `;
  }

  /**
   * Event listeners'ları ayarlar
   */
  setupEventListeners() {
    const closeButton = this.dialog.querySelector('[data-action="close"]');
    if (closeButton) {
      on(closeButton, 'click', () => {
        this.hide();
      });
    }
  }

  /**
   * Geri sayımı başlatır
   */
  startCountdown() {
    const countdownDisplay = this.dialog.querySelector('.countdown-display');
    if (!countdownDisplay) return;

    const updateCountdown = () => {
      const timeLeft = getTimeUntilNextRound();
      const formatted = formatTimeRemaining(timeLeft);
      countdownDisplay.textContent = formatted;
    };

    // İlk güncelleme
    updateCountdown();

    // Her saniye güncelle
    this.countdownInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * Dialogu gizler
   */
  hide() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

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
