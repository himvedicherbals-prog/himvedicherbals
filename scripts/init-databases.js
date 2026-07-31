/**
 * D1 Database Initialization Helper
 * Creates both databases and prints the wrangler.toml bindings to update
 */

const { execSync } = require('child_process');

const DATABASES = [
  { name: 'blog-db', binding: 'BLOG_DB', schema: 'blog-schema.sql' },
  { name: 'users-db', binding: 'USERS_DB', schema: 'users-schema.sql' },
];

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(output.trim());
    return output;
  } catch (err) {
    console.error('❌ Error:', err.stderr?.trim() || err.message);
    process.exit(1);
  }
}

function extractDatabaseId(output) {
  const match = output.match(/database_id\s*=\s*"([a-f0-9-]+)"/);
  return match ? match[1] : null;
}

function main() {
  console.log('🛠️  D1 Database Initialization for Trishanku Baba\n');
  console.log('═'.repeat(60));

  const ids = {};

  for (const db of DATABASES) {
    console.log(`\n📦 Creating database: ${db.name}`);
    console.log('─'.repeat(40));

    const output = run(`wrangler d1 create ${db.name}`);
    const id = extractDatabaseId(output);

    if (!id) {
      console.error(`❌ Could not extract database_id for ${db.name}`);
      process.exit(1);
    }

    ids[db.binding] = id;
    console.log(`\n✅ ${db.name} created — ID: ${id}`);

    // Apply schema
    if (fs.existsSync(db.schema)) {
      console.log(`\n📋 Applying schema: ${db.schema}`);
      run(`wrangler d1 execute ${db.name} --file=./${db.schema} --remote`);
    } else {
      console.warn(`⚠  Schema file ${db.schema} not found, skipping migration`);
    }
  }

  // Print instructions
  console.log('\n' + '═'.repeat(60));
  console.log('✅ BOTH DATABASES CREATED SUCCESSFULLY!\n');
  console.log('⚠️  NEXT STEP: Update your wrangler.toml with these IDs:\n');
  console.log('[[d1_databases]]');
  console.log(`binding = "BLOG_DB"`);
  console.log(`database_name = "blog-db"`);
  console.log(`database_id = "${ids.BLOG_DB}"`);
  console.log('');
  console.log('[[d1_databases]]');
  console.log(`binding = "USERS_DB"`);
  console.log(`database_name = "users-db"`);
  console.log(`database_id = "${ids.USERS_DB}"`);
  console.log('\n' + '═'.repeat(60));
  console.log('After updating wrangler.toml, run: npm run deploy');
}

const fs = require('fs');
main();