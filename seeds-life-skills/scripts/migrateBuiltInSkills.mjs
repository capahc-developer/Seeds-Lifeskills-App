/**
 * One-time SEEDS skill migration. Run from seeds-life-skills:
 *   node scripts/migrateBuiltInSkills.mjs
 *   node scripts/migrateBuiltInSkills.mjs --apply
 *
 * Requires Application Default Credentials for project seeds-life-skills.
 * Existing field values are never overwritten; only missing fields are filled.
 */
import {createRequire} from 'node:module';
import {independentStepsSkills} from '../data/independentStepsSkills.js';

const require = createRequire(import.meta.url);
const admin = require('../ai/node_modules/firebase-admin');
const projectId = 'seeds-life-skills';
const apply = process.argv.includes('--apply');

if (process.argv.some((arg) => arg.startsWith('--project='))) {
  throw new Error('This script only targets seeds-life-skills.');
}
if (!admin.apps.length) admin.initializeApp({projectId});
const db = admin.firestore();

const requiredFields = [
  'title', 'subtitle', 'icon', 'order', 'description',
  'goals', 'steps', 'strategies', 'videoUrl', 'resourceUrl',
];

console.log(`SEEDS migration — project: ${projectId} — mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
let writes = 0;
for (const skill of independentStepsSkills) {
  const ref = db.collection('skills').doc(skill.id);
  const snap = await ref.get();
  const current = snap.exists ? snap.data() : {};
  const missing = {};
  for (const field of requiredFields) {
    if (current[field] === undefined && skill[field] !== undefined) {
      missing[field] = skill[field];
    }
  }
  if (current.active === undefined) missing.active = true;
  if (current.order === undefined) missing.order = skill.order;
  const fields = Object.keys(missing);
  console.log(`${skill.id}: ${snap.exists ? 'existing' : 'NEW'}; ${fields.length ? 'fill ' + fields.join(', ') : 'complete'}`);
  if (apply && fields.length) {
    await ref.set(missing, {merge: true});
    writes++;
  }
}
console.log(apply ? `Done: ${writes} document(s) created/updated.` : 'Dry run only. Nothing changed. Run with --apply to write.');
