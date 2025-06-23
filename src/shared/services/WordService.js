/**
 * Word Service
 * Kelime yönetimi servisi
 */

import { getTimeBasedWord } from '../../core/utils/time.js';

class WordService {
  constructor() {
    this.wordList = [];
    this.currentWord = '';
    this.isLoaded = false;
  }

  /**
   * Kelime listesini yükler
   * @returns {Promise} - Yükleme promise'i
   */
  async loadWordList() {
    try {
      const response = await fetch('./src/assets/data/turkish-words-normalized.json');
      this.wordList = await response.json();
      
      if (this.wordList.length === 0) {
        throw new Error('Word list is empty');
      }
      
      this.isLoaded = true;
      this.setCurrentWord();
      return this.wordList;
    } catch (error) {
      console.error('Error loading word list:', error);
      throw error;
    }
  }

  /**
   * Mevcut kelimeyi zaman bazlı olarak ayarlar
   */
  setCurrentWord() {
    if (!this.isLoaded) {
      throw new Error('Word list not loaded yet');
    }
    this.currentWord = getTimeBasedWord(this.wordList);
  }

  /**
   * Mevcut kelimeyi döndürür
   * @returns {string} - Mevcut kelime
   */
  getCurrentWord() {
    return this.currentWord;
  }

  /**
   * Kelimenin geçerli olup olmadığını kontrol eder
   * @param {string} word - Kontrol edilecek kelime
   * @returns {boolean} - Kelime geçerli mi?
   */
  isValidWord(word) {
    if (!this.isLoaded) {
      return false;
    }
    return this.wordList.includes(word.toLowerCase());
  }

  /**
   * Kelime listesinin yüklenip yüklenmediğini kontrol eder
   * @returns {boolean} - Yüklendi mi?
   */
  isWordListLoaded() {
    return this.isLoaded;
  }

  /**
   * Kelime listesi uzunluğunu döndürür
   * @returns {number} - Kelime sayısı
   */
  getWordCount() {
    return this.wordList.length;
  }

  /**
   * Rastgele bir kelime döndürür (test amaçlı)
   * @returns {string} - Rastgele kelime
   */
  getRandomWord() {
    if (!this.isLoaded) {
      throw new Error('Word list not loaded yet');
    }
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    return this.wordList[randomIndex];
  }
}

// Singleton instance
export default new WordService();
