/**
 * Keyboard Component
 * Ekran klavyesi yönetimi
 */

import { UI_CONFIG } from '../../core/config.js';
import { createElement, addClass, removeClass, on } from '../../core/utils/dom.js';

export class Keyboard {
  constructor(container) {
    this.container = container;
    this.keyboard = null;
    this.keys = new Map();
    
    // Event callbacks
    this.onLetterClick = null;
    this.onBackspace = null;
    this.onEnter = null;
    
    this.initialize();
  }

  /**
   * Klavyeyi başlatır
   */
  initialize() {
    this.keyboard = createElement('div', {
      id: 'keyboard',
      className: 'keyboard'
    });

    this.container.appendChild(this.keyboard);
    this.generateKeyboard();
  }

  /**
   * Klavye layout'unu oluşturur
   */
  generateKeyboard() {
    this.keyboard.innerHTML = '';
    this.keys.clear();

    UI_CONFIG.KEYBOARD.LAYOUT.forEach((row, rowIndex) => {
      const keyboardRow = this.createKeyboardRow(row, rowIndex);
      this.keyboard.appendChild(keyboardRow);
    });
  }

  /**
   * Klavye satırı oluşturur
   * @param {string} rowLayout - Satır layout'u
   * @param {number} rowIndex - Satır indeksi
   * @returns {HTMLElement} - Klavye satırı elementi
   */
  createKeyboardRow(rowLayout, rowIndex) {
    const keyboardRow = createElement('div', {
      className: ['keyboard-row', `keyboard-row-${rowIndex + 1}`]
    });

    const keys = rowLayout.split(' ');
    
    keys.forEach(key => {
      const keyElement = this.createKey(key);
      keyboardRow.appendChild(keyElement);
      this.keys.set(key, keyElement);
    });

    return keyboardRow;
  }

  /**
   * Tek bir tuş oluşturur
   * @param {string} key - Tuş değeri
   * @returns {HTMLElement} - Tuş elementi
   */
  createKey(key) {
    const isSpecialKey = key === 'enter' || key === 'delete';
    
    const keyElement = createElement('button', {
      className: 'key',
      textContent: this.getKeyDisplayText(key),
      dataset: { key: key }
    });

    if (isSpecialKey) {
      keyElement.setAttribute('data-action', key);
      addClass(keyElement, `key-${key}`);
    }

    // Event listener ekle
    on(keyElement, 'click', () => this.handleKeyClick(key));
    
    return keyElement;
  }

  /**
   * Tuş görüntü metnini döndürür
   * @param {string} key - Tuş değeri
   * @returns {string} - Görüntü metni
   */
  getKeyDisplayText(key) {
    switch (key) {
      case 'enter':
        return '➤';
      case 'delete':
        return '◀';
      default:
        return key.toLocaleUpperCase('tr-TR');
    }
  }

  /**
   * Tuş tıklama olayını işler
   * @param {string} key - Tıklanan tuş
   */
  handleKeyClick(key) {
    switch (key) {
      case 'enter':
        if (this.onEnter) this.onEnter();
        break;
      case 'delete':
        if (this.onBackspace) this.onBackspace();
        break;
      default:
        if (this.onLetterClick) this.onLetterClick(key);
        break;
    }
  }

  /**
   * Tuş durumlarını günceller
   * @param {Object} keyStates - Tuş durumları objesi
   */
  updateKeyStates(keyStates) {
    Object.entries(keyStates).forEach(([letter, state]) => {
      const keyElement = this.keys.get(letter);
      if (keyElement) {
        // Önceki durumları temizle
        removeClass(keyElement, 'correct', 'present', 'absent');
        // Yeni durumu ekle
        addClass(keyElement, state);
      }
    });
  }

  /**
   * Klavyeyi sıfırlar
   */
  reset() {
    this.keys.forEach(keyElement => {
      removeClass(keyElement, 'correct', 'present', 'absent');
    });
  }

  /**
   * Belirli bir tuşu devre dışı bırakır
   * @param {string} key - Tuş değeri
   * @param {boolean} disabled - Devre dışı mı?
   */
  setKeyDisabled(key, disabled) {
    const keyElement = this.keys.get(key);
    if (keyElement) {
      keyElement.disabled = disabled;
      if (disabled) {
        addClass(keyElement, 'disabled');
      } else {
        removeClass(keyElement, 'disabled');
      }
    }
  }

  /**
   * Klavye DOM elementini döndürür
   * @returns {HTMLElement} - Klavye elementi
   */
  getElement() {
    return this.keyboard;
  }
}
