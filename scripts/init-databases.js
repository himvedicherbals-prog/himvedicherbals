#!/usr/bin/env node
/**
 * Database Initialization Script for Cloudflare D1
 * 
 * This script helps initialize and manage your D1 databases:
 * - blog-db: Blog comments, likes, views
 * - users-db: User authentication, sessions
 * 
 * Usage:
 *   node scripts/init-databases.js              # Initialize both databases
 *   node scripts/init-databases.js --blog        # Only blog-db
 *   node scripts/init-databases.js --users       # Only users-db
 *   node scripts/init-databases.js --list        # List existing databases
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(cmd, description) {
  try {
    log(`\n📌 ${description}`, 'cyan');
    const output = execSync(cmd, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      cwd: rootDir
    });
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    log(`Error executing: ${cmd}`, 'red');
    log(error.stderr || error.message, 'red');
    return false;
  }
}

async function listDatabases() {
  log('\n📋 Listing existing D1 databases...', 'yellow');
  runCommand('wrangler d1 list', 'Fetching database list');
}

async function createBlogDatabase() {
  log('\n🔧 Creating/Updating blog-db...', 'yellow');
  
  // Create database (if not exists)
  runCommand(
    'wrangler d1 create blog-db 2>/dev/null || echo "Database may already exist"',
    'Creating blog-db'
  );
  
  // Run schema migration
  const schemaPath = join(rootDir, 'blog-schema.sql');
  if (existsSync(schemaPath)) {
    runCommand(
      `wrangler d1 execute blog-db --file=${schemaPath} --remote`,
      'Applying blog-schema.sql to blog-db'
    );
    log('✅ blog-db initialized successfully!', 'green');
  } else {
    log('Warning: blog-schema.sql not found!', 'red');
  }
}

async function createUsersDatabase() {
  log('\n🔧 Creating/Updating users-db...', 'yellow');
  
  // Create database (if not exists)
  runCommand(
    'wrangler d1 create users-db 2>/dev/null || echo "Database may already exist"',
    'Creating users-db'
  );
  
  // Run schema migration
  const schemaPath = join(rootDir, 'users-schema.sql');
  if (existsSync(schemaPath)) {
    runCommand(
      `wrangler d1 execute users-db --file=${schemaPath} --remote`,
      'Applying users-schema.sql to users-db'
    );
    log('✅ users-db initialized successfully!', 'green');
  } else {
    log('Warning: users-schema.sql not found!', 'red');
  }
}

function showHelp() {
  log(`
╔══════════════════════════════════════════════════════════════╗
║     Cloudflare D1 Database Initialization Helper            ║
║         For himvedicherbals (Trishanku Baba)                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Usage:                                                      ║
║    node scripts/init-databases.js [command]                  ║
║                                                              ║
║  Commands:                                                   ║
║    (no args)   Initialize both blog-db and users-db          ║
║    --blog      Initialize only blog-db                       ║
║    --users     Initialize only users-db                      ║
║    --list      List all existing D1 databases                ║
║    --help      Show this help message                        ║
║                                                              ║
║  Prerequisites:                                              ║
║    ✅ Wrangler CLI installed (npm install -g wrangler)       ║
║    ✅ Cloudflare account authenticated (wrangler login)      ║
║    ✅ blog-schema.sql in project root                        ║
║    ✅ users-schema.sql in project root                       ║
║                                                              ║
║  After running this script:                                  ║
║    1. Copy the database IDs from the output                 ║
║    2. Update wrangler.toml with the IDs                     ║
║    3. Run: npm run deploy                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`, 'cyan');
}

// Main execution
const args = process.argv.slice(2);

log('\n🌿 Trishanku Baba - D1 Database Setup', 'yellow');
log('═════════════════════════════════════\n', 'yellow');

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else if (args.includes('--list')) {
  await listDatabases();
} else if (args.includes('--blog')) {
  await createBlogDatabase();
} else if (args.includes('--users')) {
  await createUsersDatabase();
} else {
  // Default: initialize both
  await createUsersDatabase();
  await createBlogDatabase();
  
  log(`
╔══════════════════════════════════════════════════════════════╗
║                    Next Steps                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1️⃣  Copy the database_id values from above output          ║
║                                                              ║
║  2️⃣  Update wrangler.toml:                                   ║
║      [[d1_databases]]                                        ║
║      binding = "BLOG_DB"                                     ║
║      database_name = "blog-db"                               ║
║      database_id = "PASTE_BLOG_DB_ID_HERE"                   ║
║                                                              ║
║      [[d1_databases]]                                        ║
║      binding = "USERS_DB"                                    ║
║      database_name = "users-db"                              ║
║      database_id = "PASTE_USERS_DB_ID_HERE"                  ║
║                                                              ║
║  3️⃣  Deploy to Cloudflare Pages:                            ║
║      npm run deploy                                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`, 'cyan');
}
