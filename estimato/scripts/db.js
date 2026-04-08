#!/usr/bin/env node
/**
 * Estimato DB helper — Supabase Management API
 *
 * Brug:
 *   node scripts/db.js -f supabase/schema.sql        # kør en SQL-fil
 *   node scripts/db.js -q "SELECT * FROM companies"  # kør en inline query
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// Læs .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF

if (!TOKEN || !REF) {
  console.error('Mangler SUPABASE_ACCESS_TOKEN eller SUPABASE_PROJECT_REF i .env.local')
  process.exit(1)
}

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        } else {
          resolve(JSON.parse(data))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const args = process.argv.slice(2)
  const fIdx = args.indexOf('-f')
  const qIdx = args.indexOf('-q')

  let sql
  if (fIdx !== -1 && args[fIdx + 1]) {
    sql = fs.readFileSync(path.resolve(args[fIdx + 1]), 'utf8')
  } else if (qIdx !== -1 && args[qIdx + 1]) {
    sql = args[qIdx + 1]
  } else {
    console.error('Brug: node scripts/db.js -f <fil.sql>  eller  -q "<SQL>"')
    process.exit(1)
  }

  const rows = await runSQL(sql)
  if (Array.isArray(rows) && rows.length > 0) {
    console.table(rows)
  } else {
    console.log('OK')
  }
}

main().catch(err => { console.error(err.message); process.exit(1) })
