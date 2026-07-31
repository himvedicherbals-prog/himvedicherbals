/**
 * Build Script for Cloudflare Pages
 * Copies static assets and functions into dist/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Directories/files to copy to dist
const STATIC_DIRS = ['css', 'js', 'images', 'data'];
const STATIC_FILES = ['index.html', '_headers', '_redirects', 'robots.txt', 'favicon.svg'];
const FUNCTIONS_DIR = 'functions';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`  ⚠  File not found, skipping: ${src}`);
  }
}

function main() {
  console.log('🚀 Building for Cloudflare Pages...\n');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  ensureDir(DIST);

  // Copy static directories
  console.log('📁 Copying static directories:');
  for (const dir of STATIC_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(DIST, dir));
      console.log(`  ✅ ${dir}/`);
    } else {
      console.warn(`  ⚠  ${dir}/ — not found, skipping`);
    }
  }

  // Copy static files
  console.log('\n📄 Copying static files:');
  for (const file of STATIC_FILES) {
    copyFile(path.join(ROOT, file), path.join(DIST, file));
    console.log(`  ✅ ${file}`);
  }

  // Copy functions directory
  const functionsSrc = path.join(ROOT, FUNCTIONS_DIR);
  if (fs.existsSync(functionsSrc)) {
    console.log('\n⚡ Copying Cloudflare Functions:');
    copyDir(functionsSrc, path.join(DIST, FUNCTIONS_DIR));
    console.log('  ✅ functions/');
  } else {
    console.warn('\n⚠  No functions/ directory found — API endpoints will not work');
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('✅ Build complete!');
  console.log(`   Output: ${DIST}/`);

  // List what was created
  const countFiles = (dir) => {
    let count = 0;
    if (!fs.existsSync(dir)) return 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) count += countFiles(path.join(dir, e.name));
      else count++;
    }
    return count;
  };
  console.log(`   Files: ${countFiles(DIST)}`);
  console.log('─'.repeat(50) + '\n');
}

main();