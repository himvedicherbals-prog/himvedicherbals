#!/usr/bin/env node
/**
 * Build Script for Cloudflare Pages Deployment
 * 
 * This script:
 * 1. Creates the dist/ directory
 * 2. Copies all static assets (HTML, CSS, JS, images, data)
 * 3. Copies Cloudflare configuration files (_headers, _redirects, robots.txt)
 * 4. Prepares functions/ for Cloudflare Pages Functions
 */

import { copyFile, mkdir, readdir, stat, writeFile } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Directories to copy to dist/
const STATIC_DIRS = ['css', 'js', 'images', 'data'];

// Files to copy to dist/ root
const ROOT_FILES = [
  'index.html',
  '_headers',
  '_redirects',
  'robots.txt'
];

// Console colors for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
    log(`Created: ${relative(rootDir, dirPath)}`, 'green');
  }
}

async function copyDirectory(src, dest) {
  await ensureDir(dest);
  const entries = await readdir(src);
  
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = await stat(srcPath);
    
    if (stats.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
      log(`Copied: ${relative(rootDir, srcPath)}`, 'blue');
    }
  }
}

async function copyRootFile(filename) {
  const srcPath = join(rootDir, filename);
  const destPath = join(distDir, filename);
  
  if (existsSync(srcPath)) {
    await copyFile(srcPath, destPath);
    log(`Copied: ${filename}`, 'blue');
  } else {
    log(`Warning: ${filename} not found, skipping`, 'yellow');
  }
}

async function createFunctionsDir() {
  const functionsDir = join(distDir, 'functions');
  
  // Check if source functions exist
  const sourceFunctionsDir = join(rootDir, 'functions');
  
  if (existsSync(sourceFunctionsDir)) {
    await copyDirectory(sourceFunctionsDir, functionsDir);
    log('Copied: functions/', 'blue');
  } else {
    log('Warning: No functions/ directory found in source', 'yellow');
  }
}

async function createBuildInfo() {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  };
  
  await writeFile(
    join(distDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  log('Created: build-info.json', 'green');
}

async function main() {
  const startTime = Date.now();
  
  log('\n🚀 Starting Cloudflare Pages Build...\n', 'yellow');
  log(`Source: ${rootDir}`, 'reset');
  log(`Output: ${distDir}\n`, 'reset');
  
  // Clean and create dist directory
  log('\n📁 Setting up build directory...', 'yellow');
  await ensureDir(distDir);
  
  // Copy static directories
  log('\n📦 Copying static assets...', 'yellow');
  for (const dir of STATIC_DIRS) {
    const srcPath = join(rootDir, dir);
    if (existsSync(srcPath)) {
      await copyDirectory(srcPath, join(distDir, dir));
    } else {
      log(`Warning: ${dir}/ not found, skipping`, 'yellow');
    }
  }
  
  // Copy root files
  log('\n📄 Copying root files...', 'yellow');
  for (const file of ROOT_FILES) {
    await copyRootFile(file);
  }
  
  // Copy functions
  log('\n⚡ Processing Cloudflare Functions...', 'yellow');
  await createFunctionsDir();
  
  // Create build info
  await createBuildInfo();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\n✅ Build completed in ${duration}s!`, 'green');
  log(`Output ready at: ${distDir}\n`, 'blue');
}

main().catch(error => {
  console.error('\n❌ Build failed:', error.message, '\n');
  process.exit(1);
});
