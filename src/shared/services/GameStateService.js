/**
 * Game State Service
 * Oyun durumu yönetimi servisi
 */

import { GAME_CONFIG } from '../../core/config.js';

class GameStateService {
  constructor() {
    this.reset();
  }

  /**
   * Oyun durumunu sıfırlar
   */
  reset() {
    this.targetWord = '';
    this.currentGuess = '';
    this.currentRow = 0;
    this.guessesRemaining = GAME_CONFIG.MAX_ATTEMPTS;
    this.gameState = 'playing'; // 'playing', 'won', 'lost'
    this.hintLetter = null;
    this.didUseHint = false;
    this.guesses = [];
    this.startTime = null; // Timer henüz başlamadı
    this.endTime = null;
    this.isTimerStarted = false;
  }

  /**
   * Hedef kelimeyi ayarlar
   * @param {string} word - Hedef kelime
   */
  setTargetWord(word) {
    this.targetWord = word.toLowerCase();
  }

  /**
   * Hedef kelimeyi döndürür
   * @returns {string} - Hedef kelime
   */
  getTargetWord() {
    return this.targetWord;
  }

  /**
   * Mevcut tahmini ayarlar
   * @param {string} guess - Mevcut tahmin
   */
  setCurrentGuess(guess) {
    // İlk harfi yazdığında timer'ı başlat
    if (!this.isTimerStarted && guess.length === 1) {
      this.startTimer();
    }
    this.currentGuess = guess.toLowerCase();
  }

  /**
   * Mevcut tahmini döndürür
   * @returns {string} - Mevcut tahmin
   */
  getCurrentGuess() {
    return this.currentGuess;
  }

  /**
   * Mevcut satır numarasını döndürür
   * @returns {number} - Satır numarası
   */
  getCurrentRow() {
    return this.currentRow;
  }

  /**
   * Sonraki satıra geçer
   */
  nextRow() {
    this.currentRow++;
    this.guessesRemaining--;
    this.currentGuess = '';
  }

  /**
   * Kalan tahmin sayısını döndürür
   * @returns {number} - Kalan tahmin sayısı
   */
  getGuessesRemaining() {
    return this.guessesRemaining;
  }

  /**
   * Oyun durumunu ayarlar
   * @param {string} state - Oyun durumu ('playing', 'won', 'lost')
   */
  setGameState(state) {
    this.gameState = state;
    // Oyun bitince timer'ı durdur
    if ((state === 'won' || state === 'lost') && this.isTimerStarted && !this.endTime) {
      this.endTimer();
    }
  }

  /**
   * Timer'ı başlatır (İlk harf yazıldığında)
   */
  startTimer() {
    if (!this.isTimerStarted) {
      this.startTime = new Date();
      this.isTimerStarted = true;
      console.log('⏱️ Timer started!');
    }
  }

  /**
   * Timer'ı durdurur (oyun bitince)
   */
  endTimer() {
    if (this.isTimerStarted && !this.endTime) {
      this.endTime = new Date();
      console.log('⏱️ Timer ended!');
    }
  }

  /**
   * Oyun süresini milisaniye cinsinden döndürür
   * @returns {number} - Oyun süresi (ms)
   */
  getGameDuration() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || new Date();
    return endTime - this.startTime;
  }

  /**
   * Oyun süresini human-readable formatta döndürür
   * @returns {string} - "2 dakika 30 saniye" formatında
   */
  getGameDurationFormatted() {
    const durationMs = this.getGameDuration();
    if (durationMs === 0) return 'Henüz başlamadı';
    
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds} saniye`;
    } else if (seconds === 0) {
      return `${minutes} dakika`;
    } else {
      return `${minutes} dakika ${seconds} saniye`;
    }
  }

  /**
   * Oyun durumunu döndürür
   * @returns {string} - Oyun durumu
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * Oyun devam ediyor mu?
   * @returns {boolean} - Oyun devam ediyor mu?
   */
  isGameActive() {
    return this.gameState === 'playing';
  }

  /**
   * Oyun kazanıldı mı?
   * @returns {boolean} - Oyun kazanıldı mı?
   */
  isGameWon() {
    return this.gameState === 'won';
  }

  /**
   * Oyun kaybedildi mi?
   * @returns {boolean} - Oyun kaybedildi mi?
   */
  isGameLost() {
    return this.gameState === 'lost';
  }

  /**
   * İpucu harfini ayarlar
   * @param {string} letter - İpucu harfi
   */
  setHintLetter(letter) {
    this.hintLetter = letter.toLowerCase();
    this.didUseHint = true;
  }

  /**
   * İpucu harfini döndürür
   * @returns {string|null} - İpucu harfi
   */
  getHintLetter() {
    return this.hintLetter;
  }

  /**
   * İpucu kullanıldı mı?
   * @returns {boolean} - İpucu kullanıldı mı?
   */
  isHintUsed() {
    return this.didUseHint;
  }

  /**
   * Tahmin ekler
   * @param {string} guess - Tahmin
   * @param {Array} result - Tahmin sonucu
   */
  addGuess(guess, result) {
    this.guesses.push({
      word: guess.toLowerCase(),
      result: result,
      row: this.currentRow,
      timestamp: new Date()
    });
  }

  /**
   * Tüm tahminleri döndürür
   * @returns {Array} - Tahmin listesi
   */
  getGuesses() {
    return this.guesses;
  }

  /**
   * Belirli bir harfin daha önce tahmin edilip edilmediğini kontrol eder
   * @param {string} letter - Kontrol edilecek harf
   * @returns {boolean} - Harf tahmin edildi mi?
   */
  hasGuessedLetter(letter) {
    letter = letter.toLowerCase();
    
    // Tamamlanmış tahminleri kontrol et
    for (const guess of this.guesses) {
      if (guess.word.includes(letter)) {
        return true;
      }
    }
    
    // Mevcut tahmini de kontrol et
    if (this.currentGuess.toLowerCase().includes(letter)) {
      return true;
    }
    
    return false;
  }

  /**
   * Oyun istatistiklerini döndürür
   * @returns {Object} - İstatistikler
   */
  getStats() {
    const now = new Date();
    const playTime = Math.floor((now - this.startTime) / 1000); // seconds
    
    return {
      attempts: GAME_CONFIG.MAX_ATTEMPTS - this.guessesRemaining,
      maxAttempts: GAME_CONFIG.MAX_ATTEMPTS,
      playTime,
      hintUsed: this.didUseHint,
      gameState: this.gameState,
      word: this.targetWord
    };
  }

  /**
   * Oyun durumunu JSON olarak serialize eder
   * @returns {Object} - Serialize edilmiş durum
   */
  serialize() {
    return {
      targetWord: this.targetWord,
      currentGuess: this.currentGuess,
      currentRow: this.currentRow,
      guessesRemaining: this.guessesRemaining,
      gameState: this.gameState,
      hintLetter: this.hintLetter,
      didUseHint: this.didUseHint,
      guesses: this.guesses,
      startTime: this.startTime.toISOString()
    };
  }

  /**
   * JSON'dan oyun durumunu restore eder
   * @param {Object} data - Serialize edilmiş durum
   */
  deserialize(data) {
    this.targetWord = data.targetWord || '';
    this.currentGuess = data.currentGuess || '';
    this.currentRow = data.currentRow || 0;
    this.guessesRemaining = data.guessesRemaining || GAME_CONFIG.MAX_ATTEMPTS;
    this.gameState = data.gameState || 'playing';
    this.hintLetter = data.hintLetter || null;
    this.didUseHint = data.didUseHint || false;
    this.guesses = data.guesses || [];
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
  }
}

// Singleton instance
export default new GameStateService();
