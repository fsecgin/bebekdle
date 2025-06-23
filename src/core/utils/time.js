/**
 * Time Utilities
 * Zaman yönetimi için utility fonksiyonları
 */

import { GAME_CONFIG } from '../config.js';

/**
 * Mevcut zamana göre hangi kelimenin seçileceğini hesaplar
 * @param {Array} wordArray - Kelime listesi
 * @returns {string} - Seçilen kelime
 */
export function getTimeBasedWord(wordArray) {
  if (!wordArray || wordArray.length === 0) {
    throw new Error('Word array is empty or undefined');
  }

  const now = new Date();
  const timeDiff = now - GAME_CONFIG.SERVER_START_TIME;
  
  // Geçen interval sayısını hesapla
  const intervalsPassed = Math.floor(timeDiff / GAME_CONFIG.INTERVAL_DURATION);
  
  // Negatif değerleri 0'a sabitle
  const safeIndex = Math.max(intervalsPassed, 0);
  
  // Array uzunluğunu aşarsa başa dön
  const index = safeIndex % wordArray.length;
  
  return wordArray[index];
}

/**
 * Mevcut round numarasını hesaplar
 * @returns {number} - Round numarası
 */
export function getCurrentRound() {
  const now = new Date();
  const timeDiff = now - GAME_CONFIG.SERVER_START_TIME;
  const intervalsPassed = Math.floor(timeDiff / GAME_CONFIG.INTERVAL_DURATION);
  
  return intervalsPassed + 1; // İlk round'u 1 olarak başlat
}

/**
 * Sonraki round'a kalan süreyi hesaplar
 * @returns {number} - Kalan süre (milliseconds)
 */
export function getTimeUntilNextRound() {
  const now = new Date();
  const timeDiff = now - GAME_CONFIG.SERVER_START_TIME;
  const intervalsPassed = Math.floor(timeDiff / GAME_CONFIG.INTERVAL_DURATION);
  
  const nextIntervalTime = new Date(
    GAME_CONFIG.SERVER_START_TIME.getTime() + 
    (intervalsPassed + 1) * GAME_CONFIG.INTERVAL_DURATION
  );
  
  let msLeft = nextIntervalTime - now;
  return Math.max(msLeft, 0);
}

/**
 * Kalan süreyi saat:dakika:saniye formatında döndürür
 * @param {number} milliseconds - Milliseconds cinsinden süre
 * @returns {string} - Formatlanmış süre (HH:MM:SS)
 */
export function formatTimeRemaining(milliseconds) {
  const hours = String(Math.floor(milliseconds / 3600000)).padStart(2, '0');
  const minutes = String(Math.floor((milliseconds % 3600000) / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Debounce utility fonksiyonu
 * @param {Function} func - Çalıştırılacak fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {Function} - Debounced fonksiyon
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
