const fs = require('fs');
const https = require('https');
const path = require('path');

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'oykuhhogcdbmoybskexd';
const SUPABASE_TOKEN = process.env.SUPABASE_PAT || process.env.SUPABASE_TOKEN || '';

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runMigrations() {
  const sqlFiles = [
    'sql/01_schema.sql',
    'sql/02_rls.sql',
    'sql/03_storage.sql',
    'sql/04_admin.sql',
    'sql/05_seed.sql'
  ];

  for (const file of sqlFiles) {
    console.log(`\n========================================`);
    console.log(`Running ${file}...`);
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      const res = await runQuery(sql);
      console.log(`✅ Success for ${file} (HTTP ${res.status})`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`, err.message);
    }
  }
}

runMigrations().then(() => {
  console.log('\nAll migrations processed.');
}).catch(console.error);
