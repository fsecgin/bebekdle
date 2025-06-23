/**
 * Share Service
 * Paylaşım işlemleri servisi
 */

import { SHARE_CONFIG, MESSAGES } from '../../core/config.js';
import { getCurrentRound } from '../../core/utils/time.js';

class ShareService {
  /**
   * Oyun sonucunu emoji grid'e çevirir
   * @param {Array} guesses - Tahmin listesi
   * @returns {string} - Emoji grid
   */
  buildEmojiGrid(guesses) {
    const rows = [];
    
    for (const guess of guesses) {
      let rowStr = '';
      for (const result of guess.result) {
        switch (result) {
          case 'correct':
            rowStr += SHARE_CONFIG.EMOJIS.CORRECT;
            break;
          case 'present':
            rowStr += SHARE_CONFIG.EMOJIS.PRESENT;
            break;
          case 'absent':
          default:
            rowStr += SHARE_CONFIG.EMOJIS.ABSENT;
            break;
        }
      }
      rows.push(rowStr);
    }
    
    return rows.join('\n');
  }

  /**
   * Paylaşım metnini oluşturur
   * @param {Object} gameStats - Oyun istatistikleri
   * @param {Array} guesses - Tahmin listesi
   * @returns {string} - Paylaşım metni
   */
  buildShareText(gameStats, guesses) {
    const currentRound = getCurrentRound();
    const resultLine = `Bebekdle R${currentRound} ${gameStats.attempts}/${gameStats.maxAttempts}`;
    
    const hintLine = gameStats.hintUsed 
      ? MESSAGES.SHARE.HINT_USED
      : MESSAGES.SHARE.NO_HINT;
    
    // Süre bilgisini ekle
    const durationLine = gameStats.gameDuration 
      ? `⏱️ ${gameStats.gameDuration}de çözdüm`
      : '';
    
    const emojiGrid = this.buildEmojiGrid(guesses);
    
    const lines = [resultLine, hintLine];
    if (durationLine) lines.push(durationLine);
    lines.push(emojiGrid, SHARE_CONFIG.GAME_URL);
    
    return lines.join('\n\n');
  }

  /**
   * Native share API kullanarak paylaşır
   * @param {string} shareText - Paylaşılacak metin
   * @returns {Promise} - Paylaşım promise'i
   */
  async shareNative(shareText) {
    if (!navigator.share) {
      throw new Error('Native sharing not supported');
    }

    try {
      await navigator.share({
        text: shareText,
        title: 'Bebekdle Sonuçlarım'
      });
      return { success: true, method: 'native' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, reason: 'User cancelled sharing' };
      }
      throw error;
    }
  }

  /**
   * Clipboard API kullanarak kopyalar
   * @param {string} shareText - Kopyalanacak metin
   * @returns {Promise} - Kopyalama promise'i
   */
  async copyToClipboard(shareText) {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }

    try {
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fallback share method (alert gösterir)
   * @param {string} shareText - Gösterilecek metin
   * @returns {Object} - Sonuç objesi
   */
  fallbackShare(shareText) {
    const message = `Paylaşma özelliği bu tarayıcıda desteklenmiyor.\n\nPaylaşmak istediğiniz metin:\n\n${shareText}`;
    alert(message);
    return { success: true, method: 'fallback' };
  }

  /**
   * En uygun paylaşım metodunu seçer ve kullanır
   * @param {Object} gameStats - Oyun istatistikleri
   * @param {Array} guesses - Tahmin listesi
   * @returns {Promise} - Paylaşım promise'i
   */
  async share(gameStats, guesses) {
    const shareText = this.buildShareText(gameStats, guesses);

    // 1. Önce native share'i dene
    if (navigator.share) {
      try {
        return await this.shareNative(shareText);
      } catch (error) {
        console.warn('Native sharing failed, trying clipboard:', error);
      }
    }

    // 2. Clipboard API'yi dene
    if (navigator.clipboard) {
      try {
        const result = await this.copyToClipboard(shareText);
        // Kopyalama başarılıysa kullanıcıya bildir
        alert('Sonuçlar panoya kopyalandı! 📋');
        return result;
      } catch (error) {
        console.warn('Clipboard copying failed, using fallback:', error);
      }
    }

    // 3. Fallback method
    return this.fallbackShare(shareText);
  }

  /**
   * URL paylaşımı oluşturur (sosyal medya için)
   * @param {Object} gameStats - Oyun istatistikleri
   * @param {string} platform - Platform ('twitter', 'facebook', 'whatsapp')
   * @returns {string} - Paylaşım URL'i
   */
  generateSocialShareUrl(gameStats, platform) {
    const currentRound = getCurrentRound();
    const text = `Bebekdle R${currentRound} ${gameStats.attempts}/${gameStats.maxAttempts} 💖`;
    const url = SHARE_CONFIG.GAME_URL;

    switch (platform.toLowerCase()) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Sosyal medya paylaşımını açar
   * @param {Object} gameStats - Oyun istatistikleri
   * @param {string} platform - Platform adı
   */
  shareOnSocialMedia(gameStats, platform) {
    try {
      const shareUrl = this.generateSocialShareUrl(gameStats, platform);
      window.open(shareUrl, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Social media sharing failed:', error);
      alert(`${platform} paylaşımı şu anda mevcut değil.`);
    }
  }
}

// Singleton instance
export default new ShareService();
