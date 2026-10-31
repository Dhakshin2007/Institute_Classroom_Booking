// build.js - Injects environment variables for static front-end runtime
const fs = require('fs');
const path = require('path');

let url = process.env.SUPABASE_URL || '';
let key = process.env.SUPABASE_ANON_KEY || '';

// Fallback: Read local .env file if environment variables are not set in process.env
const envPath = path.join(__dirname, '.env');
if ((!url || !key) && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const k = match[1];
      let v = match[2] || '';
      v = v.trim().replace(/^['"]|['"]$/g, '');
      if (k === 'SUPABASE_URL' && !url) url = v;
      if (k === 'SUPABASE_ANON_KEY' && !key) key = v;
    }
  });
}

const jsContent = `// Auto-generated runtime environment config - DO NOT COMMIT TO VERSION CONTROL
window.__ENV__ = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)}
};
`;

const jsDir = path.join(__dirname, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

fs.writeFileSync(path.join(jsDir, 'env.js'), jsContent, 'utf8');
console.log('✅ Generated js/env.js successfully.');
if (url && key) {
  console.log(`   Connected to Supabase project: ${url}`);
} else {
  console.log('   Notice: SUPABASE_URL / SUPABASE_ANON_KEY not set; running in local-only fallback mode.');
}
