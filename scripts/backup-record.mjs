#!/usr/bin/env node
/**
 * آخرُ خطوات النسخة الليليّة: سطرٌ في `backup.runs` يقرؤه لسان «النسخ
 * الاحتياطيّ» في اللوحة — نجحت النسخة أو فشلت.
 *
 * يجمع ما تركته الخطوات السابقة في `$RUNNER_TEMP`: `run.json` (الأعداد، من
 * backup-nightly.mjs) و`upload.json` (اسم الملفّ وحجمه). ما لم يوجد منهما
 * — لأنّ الفشل سبقه — يُترك فارغاً، ويُسجَّل الفشل مع رابط السجلّ.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const { BACKUP_DB_URL, RUNNER_TEMP, STATUS, RUN_URL } = process.env
const read = (f) => {
  try {
    return JSON.parse(readFileSync(resolve(RUNNER_TEMP, f), 'utf8'))
  } catch {
    return {}
  }
}

const row = { ...read('run.json'), ...read('upload.json'), ok: STATUS === 'success', run_url: RUN_URL }
const client = new pg.Client({ connectionString: BACKUP_DB_URL, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query('select backup.record_run($1::jsonb)', [JSON.stringify(row)])
  console.log(`سُجّلت في اللوحة: ${row.ok ? 'ناجحة' : 'فاشلة'}`)
} catch (e) {
  console.error(`تعذّر التسجيل في اللوحة: ${String(e?.message ?? e).replace(/:\/\/[^@]*@/g, '://***@')}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
