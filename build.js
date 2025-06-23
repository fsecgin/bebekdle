/**
 * Simple Build Script
 * Webpack olmadan basit build işlemi
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_DIR = join(__dirname, 'src');
const DIST_DIR = join(__dirname, 'dist');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function copyDirectory(src, dest) {
  await ensureDir(dest);
  
  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function processCSS() {
  console.log('📦 Processing CSS...');
  
  // Ana CSS dosyasını oku
  const mainCSS = await readFile(join(SRC_DIR, 'styles', 'main.css'), 'utf8');
  
  // Import'ları çözümle (basit regex ile)
  let processedCSS = mainCSS;
  
  const importRegex = /@import\s+['"](.*?)['"];/g;
  let match;
  
  while ((match = importRegex.exec(mainCSS)) !== null) {
    const importPath = match[1];
    let fullPath;
    
    if (importPath.startsWith('./')) {
      fullPath = join(SRC_DIR, 'styles', importPath);
    } else if (importPath.startsWith('../')) {
      fullPath = join(SRC_DIR, importPath);
    } else {
      fullPath = join(SRC_DIR, 'styles', importPath);
    }
    
    try {
      const importedCSS = await readFile(fullPath, 'utf8');
      processedCSS = processedCSS.replace(match[0], importedCSS);
    } catch (err) {
      console.warn(`⚠️  Could not import: ${importPath}`);
    }
  }
  
  // CSS'i dist'e yaz
  await writeFile(join(DIST_DIR, 'style.css'), processedCSS);
}

async function processJS() {
  console.log('📦 Processing JavaScript...');
  
  // Ana JS dosyasını kopyala (ES modules tarayıcıda çalışır)
  await copyFile(join(SRC_DIR, 'main.js'), join(DIST_DIR, 'main.js'));
  
  // Tüm src klasörünü kopyala (import'lar için)
  await copyDirectory(SRC_DIR, join(DIST_DIR, 'src'));
}

async function processHTML() {
  console.log('📦 Processing HTML...');
  
  let html = await readFile(join(__dirname, 'index.html'), 'utf8');
  
  // CSS ve JS path'lerini güncelle
  html = html.replace('src/styles/main.css', 'style.css');
  html = html.replace('src/main.js', 'main.js');
  
  await writeFile(join(DIST_DIR, 'index.html'), html);
}

async function copyAssets() {
  console.log('📦 Copying assets...');
  
  // .nojekyll dosyasını kopyala
  try {
    await copyFile(join(__dirname, '.nojekyll'), join(DIST_DIR, '.nojekyll'));
  } catch (err) {
    console.log('ℹ️  .nojekyll not found, skipping...');
  }
  
  // Assets klasörünü kopyala
  try {
    await copyDirectory(join(SRC_DIR, 'assets'), join(DIST_DIR, 'assets'));
  } catch (err) {
    console.log('ℹ️  Assets folder not found, skipping...');
  }
}

async function build() {
  console.log('🚀 Starting build process...\n');
  
  try {
    // Dist klasörünü temizle ve oluştur
    await ensureDir(DIST_DIR);
    
    // Build işlemleri
    await processCSS();
    await processJS();
    await processHTML();
    await copyAssets();
    
    console.log('\n✅ Build completed successfully!');
    console.log(`📁 Output: ${DIST_DIR}`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
