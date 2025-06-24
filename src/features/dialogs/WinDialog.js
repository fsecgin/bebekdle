/**
 * Win Dialog Component
 * Kazanma dialogu
 */

import { createElement, createOverlay, removeElement, on } from '../../core/utils/dom.js';
import { MESSAGES, GIFS } from '../../core/config.js';
import { getTimeUntilNextRound, formatTimeRemaining } from '../../core/utils/time.js';

export class WinDialog {
  constructor(options = {}) {
    this.options = {
      attemptsUsed: 1,
      hintUsed: false,
      guesses: [],
      onShare: null,
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
      id: 'win-overlay',
      onClick: (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      }
    });

    this.dialog = createElement('div', {
      className: 'dialog win-dialog',
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
    const duration = this.options.gameDuration || 'Bilinmiyor';
    
    return `
      <img src="${GIFS.WIN}" alt="Win GIF" class="dialog-gif" />
      <p class="dialog-text">${MESSAGES.WIN_MESSAGE}</p>
      
      <div class="game-stats-modern">
        <div class="stat-card">
          <div class="stat-icon-large">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">${duration}</div>
            <div class="stat-label">Süre</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon-large">🎯</div>
          <div class="stat-content">
            <div class="stat-value">${this.options.attemptsUsed}/${this.options.maxAttempts || 6}</div>
            <div class="stat-label">Deneme</div>
          </div>
        </div>
      </div>
      
      <div class="countdown-container">
        <div class="countdown-display">00:00:00</div>
        <div class="countdown-label">${MESSAGES.SHARE.NEXT_ROUND}</div>
      </div>
      <button class="dialog-button share-button" data-action="share">
        PAYLAŞ 📤
      </button>
    `;
  }

  /**
   * Event listeners'ları ayarlar
   */
  setupEventListeners() {
    const shareButton = this.dialog.querySelector('[data-action="share"]');
    if (shareButton) {
      on(shareButton, 'click', () => {
        if (this.options.onShare) {
          this.options.onShare();
        }
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
