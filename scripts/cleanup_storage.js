#!/usr/bin/env node

/**
 * Storage Cleanup Script
 * Deletes all files from Supabase Storage buckets
 * WARNING: This is irreversible!
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Buckets to clean
const BUCKETS = [
  'post-images',
  'comment-images',
  'media_uploads',
  'audio_uploads'
];

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
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
    rl.question('\n⚠️  WARNING: This will DELETE ALL files from Storage buckets!\n   Type "YES" to continue: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'YES');
    });
  });
}

/**
 * List all files in a bucket recursively
 */
async function listAllFiles(bucketName, prefix = '', allFiles = []) {
  const { data: files, error } = await supabase.storage
    .from(bucketName)
    .list(prefix, {
      limit: 1000,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) throw error;

  for (const file of files) {
    const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
    
    if (file.id === null) {
      // It's a folder, recurse into it
      await listAllFiles(bucketName, fullPath, allFiles);
    } else {
      // It's a file
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

/**
 * Clean a single bucket
 */
async function cleanBucket(bucketName) {
  console.log(`\n📦 Cleaning bucket: ${bucketName}`);
  
  try {
    // List all files
    const files = await listAllFiles(bucketName);

    if (files.length === 0) {
      console.log(`   ✅ Bucket ${bucketName} is already empty`);
      return { deleted: 0, errors: 0 };
    }

    console.log(`   Found ${files.length} files to delete`);

    // Delete files in batches
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .remove(batch);

        if (error) {
          console.error(`   ❌ Error deleting batch:`, error.message);
          errorCount += batch.length;
        } else {
          deletedCount += batch.length;
          
          // Show progress
          if (deletedCount % 100 === 0 || deletedCount === files.length) {
            console.log(`   Deleted ${deletedCount}/${files.length} files...`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error deleting batch:`, err.message);
        errorCount += batch.length;
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} files from ${bucketName}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} files failed to delete`);
    }

    return { deleted: deletedCount, errors: errorCount };

  } catch (error) {
    if (error.message.includes('not found')) {
      console.log(`   ⚠️  Bucket ${bucketName} does not exist, skipping...`);
      return { deleted: 0, errors: 0 };
    }
    console.error(`   ❌ Error cleaning ${bucketName}:`, error.message);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * Verify buckets are empty
 */
async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...');
  
  let allEmpty = true;
  
  for (const bucket of BUCKETS) {
    try {
      const files = await listAllFiles(bucket);
      const fileCount = files.length;
      
      if (fileCount === 0) {
        console.log(`   ✅ ${bucket}: 0 files (empty)`);
      } else {
        console.log(`   ⚠️  ${bucket}: ${fileCount} files remaining`);
        allEmpty = false;
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        console.log(`   ⚠️  ${bucket}: bucket not found`);
      } else {
        console.log(`   ❌ ${bucket}: error checking - ${error.message}`);
        allEmpty = false;
      }
    }
  }
  
  return allEmpty;
}

/**
 * Main function
 */
async function main() {
  console.log('====================================================================');
  console.log('SUPABASE STORAGE CLEANUP');
  console.log('====================================================================');
  console.log(`Buckets to clean: ${BUCKETS.join(', ')}`);

  // Ask for confirmation
  const confirmed = await askConfirmation();
  
  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled by user');
    process.exit(0);
  }

  console.log('\n🚀 Starting cleanup...');
  const startTime = Date.now();

  // Clean each bucket
  const results = {};
  for (const bucket of BUCKETS) {
    results[bucket] = await cleanBucket(bucket);
  }

  // Verify cleanup
  const allEmpty = await verifyCleanup();

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
  
  for (const bucket of BUCKETS) {
    const result = results[bucket];
    totalDeleted += result.deleted;
    totalErrors += result.errors;
    console.log(`  - ${bucket}: ${result.deleted} deleted, ${result.errors} errors`);
  }
  
  console.log('');
  console.log(`Total: ${totalDeleted} files deleted, ${totalErrors} errors`);
  console.log('====================================================================');
}

// Run cleanup
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
