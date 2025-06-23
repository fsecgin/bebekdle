/**
 * DOM Utilities
 * DOM manipülasyonu için utility fonksiyonları
 */

/**
 * Element oluşturur ve özelliklerini ayarlar
 * @param {string} tag - HTML tag adı
 * @param {Object} options - Element özellikleri
 * @returns {HTMLElement} - Oluşturulan element
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  const { 
    className, 
    textContent, 
    innerHTML, 
    style = {}, 
    attributes = {}, 
    dataset = {},
    ...rest 
  } = options;

  if (className) {
    if (Array.isArray(className)) {
      element.classList.add(...className);
    } else {
      element.className = className;
    }
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  if (innerHTML !== undefined) {
    element.innerHTML = innerHTML;
  }

  // Stil özelliklerini ayarla
  Object.entries(style).forEach(([key, value]) => {
    element.style[key] = value;
  });

  // HTML attributelerini ayarla
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  // Dataset özelliklerini ayarla
  Object.entries(dataset).forEach(([key, value]) => {
    element.dataset[key] = value;
  });

  // Diğer özellikleri ayarla
  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element[key] = value;
    }
  });

  return element;
}

/**
 * Element seçer (querySelector wrapper)
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {HTMLElement|null} - Seçilen element
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Multiple element seçer (querySelectorAll wrapper)
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {NodeList} - Seçilen elementler
 */
export function $$(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Event listener ekler
 * @param {HTMLElement|string} target - Element veya selector
 * @param {string} event - Event tipi
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export function on(target, event, handler, options = {}) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element) {
    element.addEventListener(event, handler, options);
  }
}

/**
 * Event listener kaldırır
 * @param {HTMLElement|string} target - Element veya selector
 * @param {string} event - Event tipi
 * @param {Function} handler - Event handler
 */
export function off(target, event, handler) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element) {
    element.removeEventListener(event, handler);
  }
}

/**
 * CSS class ekler
 * @param {HTMLElement|string} target - Element veya selector
 * @param {...string} classes - Eklenecek class'lar
 */
export function addClass(target, ...classes) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element) {
    element.classList.add(...classes);
  }
}

/**
 * CSS class kaldırır
 * @param {HTMLElement|string} target - Element veya selector
 * @param {...string} classes - Kaldırılacak class'lar
 */
export function removeClass(target, ...classes) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element) {
    element.classList.remove(...classes);
  }
}

/**
 * CSS class toggle yapar
 * @param {HTMLElement|string} target - Element veya selector
 * @param {string} className - Toggle edilecek class
 * @returns {boolean} - Class'ın mevcut durumu
 */
export function toggleClass(target, className) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element) {
    return element.classList.toggle(className);
  }
  return false;
}

/**
 * CSS class'ının varlığını kontrol eder
 * @param {HTMLElement|string} target - Element veya selector
 * @param {string} className - Kontrol edilecek class
 * @returns {boolean} - Class var mı?
 */
export function hasClass(target, className) {
  const element = typeof target === 'string' ? $(target) : target;
  return element ? element.classList.contains(className) : false;
}

/**
 * Overlay (modal backdrop) oluşturur
 * @param {Object} options - Overlay seçenekleri
 * @returns {HTMLElement} - Overlay element
 */
export function createOverlay(options = {}) {
  const { 
    id = 'overlay',
    zIndex = 9999,
    backgroundColor = 'rgba(0, 0, 0, 0.7)',
    onClick = null
  } = options;

  const overlay = createElement('div', {
    id,
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex
    },
    onClick: onClick
  });

  return overlay;
}

/**
 * Element'i animate eder
 * @param {HTMLElement} element - Animate edilecek element
 * @param {string} animationClass - Animation CSS class
 * @param {number} duration - Animation süresi (ms)
 * @returns {Promise} - Animation tamamlandığında resolve olan promise
 */
export function animate(element, animationClass, duration = 300) {
  return new Promise((resolve) => {
    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
      resolve();
    }, duration);
  });
}

/**
 * Element'i DOM'dan kaldırır
 * @param {HTMLElement|string} target - Element veya selector
 */
export function removeElement(target) {
  const element = typeof target === 'string' ? $(target) : target;
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Color utility - hex rengini karartır
 * @param {string} hex - Hex color kodu
 * @param {number} percent - Karartma yüzdesi
 * @returns {string} - Karartılmış hex color
 */
export function darkenColor(hex, percent) {
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  
  const num = parseInt(color, 16);
  let r = (num >> 16) - Math.round(2.55 * percent);
  let g = ((num >> 8) & 0x00ff) - Math.round(2.55 * percent);
  let b = (num & 0x0000ff) - Math.round(2.55 * percent);

  // Clamp values between 0 and 255
  if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
  return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}
