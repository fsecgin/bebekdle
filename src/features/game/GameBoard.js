/**
 * Game Board Component
 * Oyun tahtası yönetimi
 */

import { GAME_CONFIG, UI_CONFIG } from '../../core/config.js';
import { createElement, addClass, removeClass, animate } from '../../core/utils/dom.js';

export class GameBoard {
  constructor(container) {
    this.container = container;
    this.board = null;
    this.rows = [];
    this.initialize();
  }

  /**
   * Oyun tahtasını başlatır
   */
  initialize() {
    this.board = createElement('div', {
      id: 'game-board',
      className: 'game-board'
    });

    this.container.appendChild(this.board);
    this.generateBoard();
  }

  /**
   * Tahta grid'ini oluşturur
   */
  generateBoard() {
    this.rows = [];
    this.board.innerHTML = '';

    for (let i = 0; i < GAME_CONFIG.MAX_ATTEMPTS; i++) {
      const row = this.createRow(i);
      this.board.appendChild(row);
      this.rows.push(row);
    }
  }

  /**
   * Tek bir satır oluşturur
   * @param {number} rowIndex - Satır indeksi
   * @returns {HTMLElement} - Satır elementi
   */
  createRow(rowIndex) {
    const row = createElement('div', {
      className: 'row',
      dataset: { row: rowIndex }
    });

    for (let j = 0; j < GAME_CONFIG.WORD_LENGTH; j++) {
      const tile = this.createTile(rowIndex, j);
      row.appendChild(tile);
    }

    return row;
  }

  /**
   * Tek bir tile oluşturur
   * @param {number} rowIndex - Satır indeksi
   * @param {number} colIndex - Sütun indeksi
   * @returns {HTMLElement} - Tile elementi
   */
  createTile(rowIndex, colIndex) {
    return createElement('div', {
      className: 'tile',
      dataset: { 
        row: rowIndex, 
        col: colIndex 
      }
    });
  }

  /**
   * Belirli bir satırdaki tile'ları günceller
   * @param {number} rowIndex - Satır indeksi
   * @param {string} guess - Tahmin
   */
  updateRowTiles(rowIndex, guess) {
    const row = this.rows[rowIndex];
    const tiles = row.querySelectorAll('.tile');

    for (let i = 0; i < GAME_CONFIG.WORD_LENGTH; i++) {
      const tile = tiles[i];
      const letter = guess[i] || '';
      
      tile.textContent = letter.toLocaleUpperCase('tr-TR');
      
      // Tile durumlarını güncelle
      if (letter) {
        addClass(tile, 'filled');
      } else {
        removeClass(tile, 'filled');
      }
    }
  }

  /**
   * Tile'ları sonuç durumuna göre renklendirir
   * @param {number} rowIndex - Satır indeksi
   * @param {Array} results - Sonuç dizisi ('correct', 'present', 'absent')
   * @returns {Promise} - Animation promise'i
   */
  async animateRowResults(rowIndex, results) {
    const row = this.rows[rowIndex];
    const tiles = row.querySelectorAll('.tile');

    const animationPromises = [];

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const result = results[i];

      // Her tile için delay ile animation başlat
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          // Flip animation başlat
          addClass(tile, 'flip');

          // Flip animation ortasında renkleri değiştir
          setTimeout(() => {
            removeClass(tile, 'correct', 'present', 'absent');
            addClass(tile, result);
            removeClass(tile, 'flip');
            resolve();
          }, UI_CONFIG.ANIMATIONS.FLIP_DURATION);
        }, i * UI_CONFIG.ANIMATIONS.TILE_DELAY);
      });

      animationPromises.push(promise);
    }

    // Tüm animasyonların bitmesini bekle
    await Promise.all(animationPromises);
  }

  /**
   * Satırı shake animasyonu ile salla
   * @param {number} rowIndex - Satır indeksi
   * @returns {Promise} - Animation promise'i
   */
  async shakeRow(rowIndex) {
    const row = this.rows[rowIndex];
    const tiles = row.querySelectorAll('.tile');

    const promises = Array.from(tiles).map(tile => 
      animate(tile, 'shake', UI_CONFIG.ANIMATIONS.SHAKE_DURATION)
    );

    await Promise.all(promises);
  }

  /**
   * Mevcut satırdaki focus durumlarını temizler
   * @param {number} rowIndex - Satır indeksi
   */
  clearRowFocus(rowIndex) {
    const row = this.rows[rowIndex];
    const tiles = row.querySelectorAll('.tile');
    
    tiles.forEach(tile => {
      removeClass(tile, 'focused', 'filled');
    });
  }

  /**
   * Belirli bir tile'a focus ekler
   * @param {number} rowIndex - Satır indeksi
   * @param {number} colIndex - Sütun indeksi
   */
  focusTile(rowIndex, colIndex) {
    // Önce tüm focus'ları temizle
    this.clearAllFocus();
    
    if (rowIndex >= 0 && rowIndex < this.rows.length && 
        colIndex >= 0 && colIndex < GAME_CONFIG.WORD_LENGTH) {
      const row = this.rows[rowIndex];
      const tile = row.querySelector(`[data-col="${colIndex}"]`);
      if (tile) {
        addClass(tile, 'focused');
      }
    }
  }

  /**
   * Tüm focus'ları temizler
   */
  clearAllFocus() {
    this.rows.forEach(row => {
      const tiles = row.querySelectorAll('.tile');
      tiles.forEach(tile => {
        removeClass(tile, 'focused', 'filled');
      });
    });
  }

  /**
   * Sonraki satıra geçiş animasyonu
   * @param {number} fromRow - Önceki satır
   * @param {number} toRow - Yeni satır
   */
  transitionToNextRow(fromRow, toRow) {
    // Önceki satırın focus'unu temizle
    this.clearRowFocus(fromRow);
    
    // Yeni satırın ilk tile'ına focus ekle
    if (toRow < this.rows.length) {
      this.focusTile(toRow, 0);
    }
  }

  /**
   * Belirli bir tile'ın durumunu kontrol eder
   * @param {number} rowIndex - Satır indeksi
   * @param {number} colIndex - Sütun indeksi
   * @returns {string} - Tile durumu ('correct', 'present', 'absent', '')
   */
  getTileState(rowIndex, colIndex) {
    const row = this.rows[rowIndex];
    const tile = row.querySelector(`[data-col="${colIndex}"]`);
    
    if (!tile) return '';
    
    if (tile.classList.contains('correct')) return 'correct';
    if (tile.classList.contains('present')) return 'present';
    if (tile.classList.contains('absent')) return 'absent';
    
    return '';
  }

  /**
   * Tüm tahta durumunu temizler
   */
  clear() {
    this.generateBoard();
  }

  /**
   * Tahta DOM elementini döndürür
   * @returns {HTMLElement} - Tahta elementi
   */
  getElement() {
    return this.board;
  }

  /**
   * Belirli bir satırın tile'larını döndürür
   * @param {number} rowIndex - Satır indeksi
   * @returns {NodeList} - Tile elementleri
   */
  getRowTiles(rowIndex) {
    const row = this.rows[rowIndex];
    return row ? row.querySelectorAll('.tile') : [];
  }

  /**
   * Tahta boyutlarını döndürür
   * @returns {Object} - Boyut bilgileri
   */
  getDimensions() {
    return {
      rows: GAME_CONFIG.MAX_ATTEMPTS,
      cols: GAME_CONFIG.WORD_LENGTH
    };
  }
}
