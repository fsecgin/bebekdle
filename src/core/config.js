/**
 * Bebekdle Game Configuration
 * Oyun ayarları ve sabitler
 */

export const GAME_CONFIG = {
  WORD_LENGTH: 5,
  MAX_ATTEMPTS: 6,
  INTERVAL_DURATION: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  SERVER_START_TIME: new Date(2024, 11, 26, 20, 0, 0), // 27 Dec 2024, 08:00
};

export const UI_CONFIG = {
  TILE_SIZE: {
    DESKTOP: { width: 50, height: 50 },
    MOBILE: { width: 48, height: 48 },
  },
  KEYBOARD: {
    LAYOUT: [
      'e r t y u ı o p ğ ü',
      'a s d f g h j k l ş i', 
      'enter z c v b n m ö ç delete'
    ],
  },
  ANIMATIONS: {
    FLIP_DURATION: 500,
    SHAKE_DURATION: 300,
    POP_DURATION: 200,
    TILE_DELAY: 300,
  },
  SNACKBAR: {
    DURATION: 3000,
  }
};

export const MESSAGES = {
  INVALID_LENGTH: '5 harf aşkım... 😅',
  INVALID_WORD: 'Böyle bir kelime yok bebek 😩',
  WIN_MESSAGE: '💖💖 BRAVO BEBEKÇİM DOĞRU CEVAP 💖💖💖',
  HINT_MESSAGE: 'Zor mu geldi? 😼 HARF ALAYIM dersen 1 harf söylerim.',
  HINT_ALREADY_FOUND: 'AŞKIM İPUCUNU ZATEN BULMUŞSUN 🕵',
  HINT_REVEAL: (letter) => `MEMEDALİNİN ${letter.toLocaleUpperCase('tr-TR')} Sİ 👽`,
  INFO_MESSAGE: 'Daha fazla vakit geçirebilelim die, sevgiyle tasarlandı....',
  LOSE_MESSAGE: {
    MAIN: 'Maalesef bilemedik bulamadık....',
    ANSWER: (word) => `'${word.toLocaleUpperCase('tr-TR')}'`,
    FINAL: 'Cevap buymuş... Böyle bi kelime yok ki a'
  },
  SHARE: {
    HINT_USED: 'İpucu kullandım 👺',
    NO_HINT: 'İpucu kullanmadım 😎',
    NEXT_ROUND: 'Sonraki Bebekdle İçin'
  }
};

export const GIFS = {
  WIN: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHJ6dmFudTNiaGVneXdzZ2JlOHJ3cGRhMXA3OWlidm9oZjZoMHphdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/NfzERYyiWcXU4/giphy.webp',
  HINT: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmFiYjB1ZGx6bDJldWhkYWszNXNhbGN1NGY1ZGFycXVobXVlZWZ3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XVbQsIjdXDNyswwxOO/200.webp',
  INFO: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTh6NzQ0eGhhZnY3azg3aGV6bDUxdmNvdHQ5ZXh5M203a2YweXI5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.webp',
  LOSE: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWVta3E4dWMza3BlanNyNjRvaDFiZHR4ZW85eW95OG51d213c3NtciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uUvyQdPSl8dhu/giphy.webp'
};

export const SHARE_CONFIG = {
  GAME_URL: 'https://fsecgin.github.io/bebekdle/',
  EMOJIS: {
    CORRECT: '🟩',
    PRESENT: '🟨',
    ABSENT: '⬜'
  }
};
