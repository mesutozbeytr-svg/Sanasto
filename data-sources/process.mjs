import { readFileSync, writeFileSync } from 'fs';

function parseTei(xmlContent) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xmlContent)) !== null) {
    const block = match[1];
    const orthMatch = block.match(/<orth>([^<]+)<\/orth>/);
    if (!orthMatch) continue;
    const headword = orthMatch[1].trim();
    const posMatch = block.match(/<pos>([^<]+)<\/pos>/);
    const pos = posMatch ? posMatch[1].trim() : null;
    const transRegex = /<cit type="trans"[^>]*>\s*<quote>([^<]+)<\/quote>/g;
    const translations = [];
    let transMatch;
    while ((transMatch = transRegex.exec(block)) !== null) translations.push(transMatch[1].trim());
    if (translations.length === 0) continue;
    entries.push({ headword, pos: mapPos(pos), translations });
  }
  return entries;
}

function mapPos(pos) {
  if (!pos) return null;
  const l = pos.toLowerCase();
  if (l === 'n' || l === 'noun') return 'noun';
  if (l === 'v' || l === 'verb') return 'verb';
  if (l === 'adj' || l === 'adjective') return 'adjective';
  if (l === 'adv' || l === 'adverb') return 'adverb';
  if (l === 'pn' || l === 'pronoun') return 'pronoun';
  return 'other';
}

function parseFrequency(path, max = 50000) {
  const lines = readFileSync(path, 'utf-8').trim().split('\n').slice(0, max);
  const m = new Map();
  let rank = 0;
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const word = parts[0].toLowerCase();
    const count = parseInt(parts[1], 10);
    if (!word || isNaN(count)) continue;
    rank++;
    m.set(word, { rank, count });
  }
  return m;
}

function parseKotus(path) {
  const content = readFileSync(path, 'utf-8');
  const entries = new Map();
  const re = /<st>(?:\s*<s>([^<]+)<\/s>)(?:\s*<hn>([^<]+)<\/hn>)?(?:\s*<t>(?:\s*<tn>([^<]+)<\/tn>)?(?:\s*<av>([^<]+)<\/av>)?<\/t>)?\s*<\/st>/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    entries.set(match[1].trim().toLowerCase(), { word: match[1].trim(), tn: match[3] || null });
  }
  return entries;
}

function kotusTnToWordType(tn) {
  if (!tn) return null;
  const n = parseInt(tn, 10);
  if (isNaN(n)) return null;
  if (n >= 1 && n <= 48) return 'noun';
  if (n >= 49 && n <= 78) return 'verb';
  if (n === 99) return 'adverb';
  return null;
}

function estimateCEFR(rank) {
  if (!rank || rank <= 0) return null;
  if (rank <= 1000) return 'A1';
  if (rank <= 2000) return 'A2';
  if (rank <= 4000) return 'B1';
  if (rank <= 8000) return 'B2';
  if (rank <= 16000) return 'C1';
  return 'C2';
}

console.log('Parsing sources...');
const finTur = parseTei(readFileSync('fin-tur/fin-tur.tei', 'utf-8'));
const turFin = parseTei(readFileSync('tur-fin/tur-fin.tei', 'utf-8'));
const freq = parseFrequency('fi_50k.txt');
const kotus = parseKotus('kotus-sanalista_v1.xml');
console.log(`fin-tur: ${finTur.length}, tur-fin: ${turFin.length}, freq: ${freq.size}, kotus: ${kotus.size}`);

const wordMap = new Map();

for (const entry of finTur) {
  const fi = entry.headword.trim();
  const key = fi.toLowerCase();
  if (!key || (fi.includes(' ') && fi.length > 30)) continue;
  const f = freq.get(key);
  const k = kotus.get(key);
  let wt = entry.pos;
  if (!wt && k) wt = kotusTnToWordType(k.tn);
  if (wordMap.has(key)) {
    for (const tr of entry.translations) if (!wordMap.get(key).translations.includes(tr)) wordMap.get(key).translations.push(tr);
  } else {
    wordMap.set(key, { finnish: fi, translations: [...entry.translations], word_type: wt || 'other', level: f ? estimateCEFR(f.rank) : null, frequency_rank: f?.rank || null, frequency_count: f?.count || null, has_kotus: !!k, source: 'freedict-fin-tur' });
  }
}

for (const entry of turFin) {
  const tr = entry.headword.trim();
  if (!tr || (tr.includes(' ') && tr.length > 30)) continue;
  for (const fiTrans of entry.translations) {
    const fi = fiTrans.trim();
    const key = fi.toLowerCase();
    if (!key || fi.length > 50 || fi.split(' ').length > 4) continue;
    const f = freq.get(key);
    const k = kotus.get(key);
    if (wordMap.has(key)) {
      if (!wordMap.get(key).translations.includes(tr)) wordMap.get(key).translations.push(tr);
      if (!wordMap.get(key).source.includes('tur-fin')) wordMap.get(key).source += ',freedict-tur-fin';
    } else {
      let wt = entry.pos;
      if (!wt && k) wt = kotusTnToWordType(k.tn);
      wordMap.set(key, { finnish: fi, translations: [tr], word_type: wt || 'other', level: f ? estimateCEFR(f.rank) : null, frequency_rank: f?.rank || null, frequency_count: f?.count || null, has_kotus: !!k, source: 'freedict-tur-fin' });
    }
  }
}

const library = [...wordMap.values()].map(w => ({
  finnish: w.finnish,
  turkish: w.translations.join(', '),
  word_type: w.word_type,
  level: w.level,
  level_verified: false,
  frequency_rank: w.frequency_rank,
  frequency_count: w.frequency_count,
  has_kotus_validation: w.has_kotus,
  source: w.source,
})).sort((a, b) => {
  if (a.frequency_rank && b.frequency_rank) return a.frequency_rank - b.frequency_rank;
  if (a.frequency_rank) return -1;
  if (b.frequency_rank) return 1;
  return a.finnish.localeCompare(b.finnish);
});

console.log(`Total: ${library.length} words`);
const stats = {
  total: library.length,
  with_freq: library.filter(w => w.frequency_rank).length,
  with_kotus: library.filter(w => w.has_kotus_validation).length,
  with_level: library.filter(w => w.level).length,
  by_level: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, null: 0 },
  by_type: {},
};
for (const w of library) { stats.by_level[w.level || 'null']++; stats.by_type[w.word_type] = (stats.by_type[w.word_type] || 0) + 1; }
console.log('Stats:', JSON.stringify(stats, null, 2));

writeFileSync('processed-word-library.json', JSON.stringify(library));

// Generate SQL batches of 250 rows (smaller for execute_sql limits)
const BATCH = 250;
for (let b = 0; b * BATCH < library.length; b++) {
  const chunk = library.slice(b * BATCH, (b + 1) * BATCH);
  const values = chunk.map(w => {
    const esc = s => s.replace(/'/g, "''");
    const lvl = w.level ? `'${w.level}'` : 'NULL';
    const fr = w.frequency_rank || 'NULL';
    const fc = w.frequency_count || 'NULL';
    const hk = w.has_kotus_validation ? 'true' : 'false';
    return `('${esc(w.finnish)}','${esc(w.turkish)}','${w.word_type}',${lvl},false,${fr},${fc},${hk},'${esc(w.source)}','CC BY-SA 3.0')`;
  });
  writeFileSync(`batch_${b}.sql`, `INSERT INTO word_library (finnish, turkish, word_type, level, level_verified, frequency_rank, frequency_count, has_kotus_validation, source, license) VALUES ${values.join(',')} ON CONFLICT DO NOTHING;`);
}
console.log(`Generated ${Math.ceil(library.length / BATCH)} batch files`);
