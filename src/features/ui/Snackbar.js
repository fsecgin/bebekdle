/**
 * Snackbar Component
 * Bildirim mesajları gösterimi
 */

import { createElement, addClass, removeClass } from '../../core/utils/dom.js';
import { UI_CONFIG } from '../../core/config.js';

export class Snackbar {
  constructor() {
    this.snackbar = null;
    this.currentTimeout = null;
    this.initialize();
  }

  /**
   * Snackbar'ı başlatır
   */
  initialize() {
    // Existing snackbar kullan veya yeni oluştur
    this.snackbar = document.getElementById('snackbar');
    
    if (!this.snackbar) {
      this.snackbar = createElement('div', {
        id: 'snackbar',
        className: 'snackbar'
      });
      document.body.appendChild(this.snackbar);
    }
  }

  /**
   * Snackbar mesajı gösterir
   * @param {string} message - Gösterilecek mesaj
   * @param {number} duration - Gösterim süresi (ms)
   * @param {string} type - Mesaj tipi ('info', 'success', 'warning', 'error')
   */
  show(message, duration = UI_CONFIG.SNACKBAR.DURATION, type = 'info') {
    if (!this.snackbar) return;

    // Önceki timeout'u temizle
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    // Önceki durumları temizle
    removeClass(this.snackbar, 'show', 'info', 'success', 'warning', 'error');

    // Mesajı ayarla
    this.snackbar.textContent = message;
    
    // Tip class'ını ekle
    addClass(this.snackbar, type);

    // Göster
    addClass(this.snackbar, 'show');

    // Belirtilen süre sonra gizle
    this.currentTimeout = setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * Snackbar'ı gizler
   */
  hide() {
    if (this.snackbar) {
      removeClass(this.snackbar, 'show');
    }
    
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  }

  /**
   * Başarı mesajı gösterir
   * @param {string} message - Mesaj
   * @param {number} duration - Süre
   */
  showSuccess(message, duration = UI_CONFIG.SNACKBAR.DURATION) {
    this.show(message, duration, 'success');
  }

  /**
   * Hata mesajı gösterir
   * @param {string} message - Mesaj
   * @param {number} duration - Süre
   */
  showError(message, duration = UI_CONFIG.SNACKBAR.DURATION) {
    this.show(message, duration, 'error');
  }

  /**
   * Uyarı mesajı gösterir
   * @param {string} message - Mesaj
   * @param {number} duration - Süre
   */
  showWarning(message, duration = UI_CONFIG.SNACKBAR.DURATION) {
    this.show(message, duration, 'warning');
  }

  /**
   * Bilgi mesajı gösterir
   * @param {string} message - Mesaj
   * @param {number} duration - Süre
   */
  showInfo(message, duration = UI_CONFIG.SNACKBAR.DURATION) {
    this.show(message, duration, 'info');
  }

  /**
   * Snackbar'ın görünür olup olmadığını kontrol eder
   * @returns {boolean} - Görünür mü?
   */
  isVisible() {
    return this.snackbar && this.snackbar.classList.contains('show');
  }

  /**
   * Snackbar'ı yok eder
   */
  destroy() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    
    if (this.snackbar && this.snackbar.parentNode) {
      this.snackbar.parentNode.removeChild(this.snackbar);
    }
    
    this.snackbar = null;
    this.currentTimeout = null;
  }
}
