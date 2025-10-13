#!/usr/bin/env node

/**
 * Database Cleanup Script (Node.js version)
 * Deletes all data from Supabase database
 * Works without psql!
 * WARNING: This is irreversible!
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').config({ path: envPath });
  if (envConfig.parsed) {
    Object.assign(process.env, envConfig.parsed);
  }
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables!');
  console.error('');
  console.error('Создайте файл .env.local в корне проекта:');
  console.error('');
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('Ключи найдете в: Supabase Dashboard → Settings → API');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Ask for user confirmation
 */
async function askConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will DELETE ALL data from database!\n   Type "YES" to continue: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'YES');
    });
  });
}

/**
 * Delete all records from a table
 */
async function cleanupTable(tableName) {
  console.log(`\n🗑️  Cleaning ${tableName}...`);
  
  try {
    // First, count records
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count === 0) {
      console.log(`   ✅ Table ${tableName} is already empty`);
      return { deleted: 0, errors: 0 };
    }

    console.log(`   Found ${count} records to delete`);

    // Delete all records
    // Note: Supabase has a limit on delete operations, so we need to delete in batches
    let totalDeleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Get IDs of records to delete (limit 1000)
      const { data: records, error: fetchError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1000);

      if (fetchError) throw fetchError;
      
      if (!records || records.length === 0) {
        hasMore = false;
        break;
      }

      // Delete these records
      const ids = records.map(r => r.id);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (deleteError) throw deleteError;

      totalDeleted += ids.length;
      console.log(`   Deleted ${totalDeleted}/${count} records...`);
    }

    console.log(`   ✅ Deleted ${totalDeleted} records from ${tableName}`);
    return { deleted: totalDeleted, errors: 0 };

  } catch (error) {
    console.error(`   ❌ Error cleaning ${tableName}:`, error.message);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * Verify cleanup
 */
async function verifyCleanup(tables) {
  console.log('\n🔍 Verifying cleanup...');
  
  let allEmpty = true;
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      if (count === 0) {
        console.log(`   ✅ ${table}: 0 records (empty)`);
      } else {
        console.log(`   ⚠️  ${table}: ${count} records remaining`);
        allEmpty = false;
      }
    } catch (error) {
      console.log(`   ❌ ${table}: error checking - ${error.message}`);
      allEmpty = false;
    }
  }
  
  return allEmpty;
}

/**
 * Main function
 */
async function main() {
  console.log('====================================================================');
  console.log('SUPABASE DATABASE CLEANUP (Node.js)');
  console.log('====================================================================');

  // Ask for confirmation
  const confirmed = await askConfirmation();
  
  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled by user');
    process.exit(0);
  }

  console.log('\n🚀 Starting cleanup...');
  const startTime = Date.now();

  // Tables to clean (in correct order - children first!)
  const tables = [
    'post_tags',
    'post_views',
    'post_reactions',
    'comment_reactions',
    'bookmarks',
    'direct_messages',
    'conversations',
    'notifications',
    'reports',
    'comments',
    'posts',
    'blocked_users',
    'friendships',
    'subscriptions',
    'tags',
    'profiles'
  ];

  // Clean each table
  const results = {};
  for (const table of tables) {
    results[table] = await cleanupTable(table);
  }

  // Verify cleanup
  const allEmpty = await verifyCleanup(tables);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n====================================================================');
  if (allEmpty) {
    console.log('✅ CLEANUP COMPLETED SUCCESSFULLY!');
  } else {
    console.log('⚠️  CLEANUP COMPLETED WITH WARNINGS');
  }
  console.log('====================================================================');
  console.log(`Duration: ${duration} seconds`);
  console.log('\nResults:');
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const table of tables) {
    const result = results[table];
    totalDeleted += result.deleted;
    totalErrors += result.errors;
    console.log(`  - ${table.padEnd(24)} ${result.deleted} deleted, ${result.errors} errors`);
  }
  
  console.log('');
  console.log(`Total: ${totalDeleted} records deleted, ${totalErrors} errors`);
  console.log('');
  console.log('⚠️  IMPORTANT: Clean up Storage files separately!');
  console.log('   Run: npm run cleanup:storage');
  console.log('====================================================================');
}

// Run cleanup
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
