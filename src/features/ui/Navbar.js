/**
 * Navbar Component
 * Üst navigation bar yönetimi
 */

import { createElement, on } from '../../core/utils/dom.js';

export class Navbar {
  constructor(container) {
    this.container = container;
    this.roundInfo = null;
    this.heartIcon = null;
    this.infoIcon = null;
    this.hintIcon = null;
    
    // Event callbacks
    this.onInfoClick = null;
    this.onHintClick = null;
    this.onMultiplayerClick = null;
    
    this.initialize();
  }

  /**
   * Navbar'ı başlatır
   */
  initialize() {
    // Existing navbar kullan veya yeni oluştur
    if (!this.container) {
      this.container = createElement('div', {
        id: 'top-navbar',
        className: 'top-navbar'
      });
      document.body.prepend(this.container);
    }

    this.setupElements();
    this.setupEventListeners();
  }

  /**
   * Navbar elementlerini ayarlar
   */
  setupElements() {
    // Round info elementi
    this.roundInfo = this.container.querySelector('#round-info');
    if (!this.roundInfo) {
      this.roundInfo = createElement('span', {
        id: 'round-info',
        className: 'round-info'
      });
      
      const leftSection = this.container.querySelector('#navbar-left');
      if (leftSection) {
        leftSection.appendChild(this.roundInfo);
      }
    }

    // Heart icon
    this.heartIcon = this.container.querySelector('#heart-icon');
    
    // Info icon
    this.infoIcon = this.container.querySelector('#info-icon');
    
    // Hint icon
    this.hintIcon = this.container.querySelector('#hint-icon');
    
    // Multiplayer icon
    this.multiplayerIcon = this.container.querySelector('#multiplayer-icon');
  }

  /**
   * Event listener'ları ayarlar
   */
  setupEventListeners() {
    if (this.infoIcon) {
      on(this.infoIcon, 'click', () => {
        if (this.onInfoClick) this.onInfoClick();
      });
    }

    if (this.hintIcon) {
      on(this.hintIcon, 'click', () => {
        if (this.onHintClick) this.onHintClick();
      });
    }
    
    if (this.multiplayerIcon) {
      on(this.multiplayerIcon, 'click', () => {
        if (this.onMultiplayerClick) this.onMultiplayerClick();
      });
    }
  }

  /**
   * Round numarasını ayarlar
   * @param {number} round - Round numarası
   */
  setRound(round) {
    if (this.roundInfo) {
      this.roundInfo.textContent = `R${round}`;
    }
  }

  /**
   * Navbar görünürlüğünü değiştirir
   * @param {boolean} visible - Görünür mü?
   */
  setVisible(visible) {
    if (this.container) {
      this.container.style.display = visible ? 'grid' : 'none';
    }
  }

  /**
   * Icon durumunu değiştirir
   * @param {string} iconName - Icon adı ('info', 'hint')
   * @param {boolean} enabled - Aktif mi?
   */
  setIconEnabled(iconName, enabled) {
    const icon = iconName === 'info' ? this.infoIcon : this.hintIcon;
    if (icon) {
      icon.style.opacity = enabled ? '1' : '0.5';
      icon.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  /**
   * Kalp animasyonu çalar
   */
  animateHeart() {
    if (this.heartIcon) {
      this.heartIcon.style.animation = 'pulse 0.6s ease-in-out';
      setTimeout(() => {
        this.heartIcon.style.animation = '';
      }, 600);
    }
  }
}
