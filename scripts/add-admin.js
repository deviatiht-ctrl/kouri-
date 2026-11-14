const https = require('https');

const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'oykuhhogcdbmoybskexd';
const SUPABASE_TOKEN = process.env.SUPABASE_PAT || process.env.SUPABASE_TOKEN || '';

const sql = `
INSERT INTO public.admin_users (email)
VALUES 
  ('laurorejeanclarens0@gmail.com'),
  ('laurorejeanclarens9@gmail.com')
ON CONFLICT (email) DO NOTHING;

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE lower(email) IN ('laurorejeanclarens0@gmail.com', 'laurorejeanclarens9@gmail.com')
);

SELECT email, created_at FROM public.admin_users;
`;

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
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, '\nADMIN USERS:\n', body));
});

req.on('error', console.error);
req.write(data);
req.end();
