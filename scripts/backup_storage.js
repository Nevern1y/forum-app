#!/usr/bin/env node

/**
 * Storage Backup Script
 * Downloads all files from Supabase Storage buckets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_DIR = path.join(__dirname, '..', 'storage-backup');

// Buckets to backup
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

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Download a file from URL
 */
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Backup a single bucket
 */
async function backupBucket(bucketName) {
  console.log(`\n📦 Backing up bucket: ${bucketName}`);
  
  try {
    // List all files in bucket
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      if (error.message.includes('not found')) {
        console.log(`⚠️  Bucket ${bucketName} does not exist, skipping...`);
        return;
      }
      throw error;
    }

    if (!files || files.length === 0) {
      console.log(`✅ Bucket ${bucketName} is empty`);
      return;
    }

    console.log(`   Found ${files.length} files`);

    // Create bucket directory
    const bucketDir = path.join(BACKUP_DIR, bucketName);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    // Download each file
    let downloadedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      if (file.id === null) continue; // Skip folders

      try {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(file.name);

        // Download file
        const filepath = path.join(bucketDir, file.name);
        
        // Create subdirectories if needed
        const fileDir = path.dirname(filepath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        await downloadFile(publicUrl, filepath);
        downloadedCount++;
        
        // Show progress
        if (downloadedCount % 10 === 0) {
          console.log(`   Downloaded ${downloadedCount}/${files.length} files...`);
        }
      } catch (err) {
        console.error(`   ❌ Error downloading ${file.name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`✅ Backed up ${downloadedCount} files from ${bucketName}`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} files failed to download`);
    }

  } catch (error) {
    console.error(`❌ Error backing up ${bucketName}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('====================================================================');
  console.log('SUPABASE STORAGE BACKUP');
  console.log('====================================================================');
  console.log(`Backup directory: ${BACKUP_DIR}`);
  console.log(`Buckets to backup: ${BUCKETS.join(', ')}`);
  console.log('');

  const startTime = Date.now();

  // Backup each bucket
  for (const bucket of BUCKETS) {
    await backupBucket(bucket);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('====================================================================');
  console.log('BACKUP COMPLETED!');
  console.log('====================================================================');
  console.log(`Backup location: ${BACKUP_DIR}`);
  console.log(`Duration: ${duration} seconds`);
  console.log('');
  console.log('Files backed up:');
  
  // Count files in each bucket
  for (const bucket of BUCKETS) {
    const bucketDir = path.join(BACKUP_DIR, bucket);
    if (fs.existsSync(bucketDir)) {
      const files = fs.readdirSync(bucketDir, { recursive: true });
      const fileCount = files.filter(f => {
        const fullPath = path.join(bucketDir, f);
        return fs.statSync(fullPath).isFile();
      }).length;
      console.log(`  - ${bucket}: ${fileCount} files`);
    } else {
      console.log(`  - ${bucket}: 0 files (bucket not found or empty)`);
    }
  }
  
  console.log('====================================================================');
}

// Run backup
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
