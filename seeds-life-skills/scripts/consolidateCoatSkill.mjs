/**
 * Preview or safely fill missing fields on the existing official coat skill.
 * From seeds-life-skills:
 *   node scripts/consolidateCoatSkill.mjs
 *   node scripts/consolidateCoatSkill.mjs --apply
 *
 * Never deletes the duplicate, changes IDs, or overwrites existing fields.
 * Uses the same Application Default Credentials as migrateBuiltInSkills.mjs.
 */
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const admin = require('../ai/node_modules/firebase-admin');
const projectId = 'seeds-life-skills';
const officialId = 'zip-up-a-winter-coat';
const duplicateId = 'zip-winter-coat';
const apply = process.argv.includes('--apply');
if (process.argv.some((arg) => arg.startsWith('--') && arg !== '--apply')) {
  throw new Error('Only --apply is supported.');
}
if (!admin.apps.length) admin.initializeApp({projectId});
const db = admin.firestore();
const officialRef = db.collection('skills').doc(officialId);
const duplicateRef = db.collection('skills').doc(duplicateId);
const [officialSnap, duplicateSnap] = await Promise.all([
  officialRef.get(), duplicateRef.get(),
]);
if (!officialSnap.exists || !duplicateSnap.exists) {
  throw new Error('Both skill documents must exist. No changes made.');
}
const official = officialSnap.data();
const duplicate = duplicateSnap.data();
const missing = {};
for (const [key, value] of Object.entries(duplicate)) {
  if (official[key] === undefined && value !== undefined) missing[key] = value;
}
console.log('Project:', projectId);
console.log('Official skill:', officialId);
console.log('Duplicate skill (preserved):', duplicateId);
console.log('Mode:', apply ? 'APPLY' : 'DRY RUN');
console.log('Fields to add to official skill:', Object.keys(missing).join(', ') || '(none)');
console.log('Existing official fields will not be overwritten.');

// Report references from existing records. Queries are read-only.
const checks = [
  ['practice logs (legacy collection)', () => db.collection('practiceLog').where('skillId', '==', duplicateId).get()],
  ['practice logs (collection group)', () => db.collectionGroup('practiceLogs').where('skillId', '==', duplicateId).get()],
  ['practice logs (alternate collection group)', () => db.collectionGroup('practiceLog').where('skillId', '==', duplicateId).get()],
  ['parent step customizations', () => db.collectionGroup('skillCustomizations').where(admin.firestore.FieldPath.documentId(), '==', duplicateId).get()],
];
let unknownChecks = 0;
for (const [label, fetch] of checks) {
  try {
    const snapshot = await fetch();
    console.log(`${label}: ${snapshot.size} reference(s) to duplicate ID`);
  } catch (err) {
    unknownChecks++;
    console.warn(`${label}: could not check (${err.code || err.message}). No records modified.`);
  }
}
console.log('Note: These checks cannot prove that every possible ID reference is absent.');
if (apply) {
  if (Object.keys(missing).length) {
    await db.runTransaction(async (transaction) => {
      const latest = await transaction.get(officialRef);
      if (!latest.exists) throw new Error('Official skill disappeared. Aborting.');
      const additions = {};
      for (const [key, value] of Object.entries(missing)) {
        if (latest.data()[key] === undefined) additions[key] = value;
      }
      if (Object.keys(additions).length) transaction.set(officialRef, additions, {merge: true});
    });
  }
  console.log('Official skill updated. Duplicate preserved; nothing deleted.');
} else {
  console.log('Dry run only; no Firestore writes. Review before --apply.');
}
if (unknownChecks) console.log(`${unknownChecks} reference check(s) inconclusive; do not delete duplicate.`);
