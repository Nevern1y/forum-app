#!/usr/bin/env node

/**
 * Database Backup Script (Node.js version)
 * Downloads all data from Supabase database to CSV files
 * Works without psql!
 */

const fs = require('fs');
const path = require('path');
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
const BACKUP_DIR = path.join(__dirname, '..', 'database-backup');

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

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Convert JSON to CSV
 */
function jsonToCsv(data, columns) {
  if (!data || data.length === 0) return '';
  
  const headers = columns || Object.keys(data[0]);
  const csvRows = [];
  
  // Add header
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Backup a single table
 */
async function backupTable(tableName, filename) {
  console.log(`\n📦 Backing up ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log(`   ✅ Table ${tableName} is empty`);
      return 0;
    }

    // Convert to CSV
    const csv = jsonToCsv(data);
    
    // Write to file
    const filepath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filepath, csv, 'utf8');
    
    console.log(`   ✅ Backed up ${data.length} records to ${filename}`);
    return data.length;

  } catch (error) {
    console.error(`   ❌ Error backing up ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('====================================================================');
  console.log('SUPABASE DATABASE BACKUP (Node.js)');
  console.log('====================================================================');
  console.log(`Backup directory: ${BACKUP_DIR}`);
  console.log('');

  const startTime = Date.now();
  const stats = {};

  // Backup all tables
  const tables = [
    { name: 'profiles', file: 'backup_profiles.csv' },
    { name: 'posts', file: 'backup_posts.csv' },
    { name: 'comments', file: 'backup_comments.csv' },
    { name: 'post_reactions', file: 'backup_post_reactions.csv' },
    { name: 'comment_reactions', file: 'backup_comment_reactions.csv' },
    { name: 'post_views', file: 'backup_post_views.csv' },
    { name: 'bookmarks', file: 'backup_bookmarks.csv' },
    { name: 'subscriptions', file: 'backup_subscriptions.csv' },
    { name: 'friendships', file: 'backup_friendships.csv' },
    { name: 'conversations', file: 'backup_conversations.csv' },
    { name: 'direct_messages', file: 'backup_direct_messages.csv' },
    { name: 'notifications', file: 'backup_notifications.csv' },
    { name: 'blocked_users', file: 'backup_blocked_users.csv' },
    { name: 'reports', file: 'backup_reports.csv' },
    { name: 'tags', file: 'backup_tags.csv' },
    { name: 'post_tags', file: 'backup_post_tags.csv' }
  ];

  for (const table of tables) {
    const count = await backupTable(table.name, table.file);
    stats[table.name] = count;
  }

  // Write statistics
  const statsPath = path.join(BACKUP_DIR, 'backup_statistics.txt');
  let statsContent = 'BACKUP STATISTICS\n';
  statsContent += `Generated At: ${new Date().toISOString()}\n\n`;
  statsContent += 'Table                    Records\n';
  statsContent += '======================== =======\n';
  
  let totalRecords = 0;
  for (const [table, count] of Object.entries(stats)) {
    statsContent += `${table.padEnd(24)} ${count}\n`;
    totalRecords += count;
  }
  
  statsContent += '======================== =======\n';
  statsContent += `TOTAL                    ${totalRecords}\n`;
  
  fs.writeFileSync(statsPath, statsContent, 'utf8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('====================================================================');
  console.log('BACKUP COMPLETED!');
  console.log('====================================================================');
  console.log(`Backup location: ${BACKUP_DIR}`);
  console.log(`Duration: ${duration} seconds`);
  console.log(`Total records: ${totalRecords}`);
  console.log('');
  console.log('Files created:');
  for (const table of tables) {
    const count = stats[table.name] || 0;
    console.log(`  - ${table.file} (${count} records)`);
  }
  console.log(`  - backup_statistics.txt`);
  console.log('');
  console.log('⚠️  IMPORTANT: Backup Storage files separately!');
  console.log('   Run: npm run backup:storage');
  console.log('====================================================================');
}

// Run backup
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
