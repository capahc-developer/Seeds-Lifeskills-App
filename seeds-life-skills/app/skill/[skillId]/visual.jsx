import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { getBytes, getDownloadURL, listAll, ref as storageRef } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { auth, db, storage } from '../../../lib/firebase';
import { findIndependentStepsSkill } from '../../../data/independentStepsSkills';
import { useStudentProfile } from '../../../context/StudentProfileContext';

const genericSteps = [
  'Get ready and gather what you need.',
  'Start the first part of the skill.',
  'Continue through the task one step at a time.',
  'Check that the task is complete.',
];

const backgroundThemes = [
  {
    id: 'garden',
    title: 'Garden',
    subtitle: 'Soft green and calm',
    icon: 'leaf-outline',
    pageBg: '#F3FAF6',
    cardBg: '#FFFFFF',
    accent: '#45A66B',
    accentSoft: '#E3F3E9',
    border: '#D7ECE0',
    text: '#243247',
    muted: '#6C7A70',
    placeholderBg: '#F5F9F6',
    placeholderBorder: '#AFC4B5',
  },
  {
    id: 'sky',
    title: 'Sky',
    subtitle: 'Blue and airy',
    icon: 'cloud-outline',
    pageBg: '#F2F8FF',
    cardBg: '#FFFFFF',
    accent: '#4A90E2',
    accentSoft: '#E4F0FF',
    border: '#D8E8FA',
    text: '#20324A',
    muted: '#6D7D90',
    placeholderBg: '#F5F9FF',
    placeholderBorder: '#B5C8DD',
  },
  {
    id: 'sunshine',
    title: 'Sunshine',
    subtitle: 'Warm and cheerful',
    icon: 'sunny-outline',
    pageBg: '#FFF9ED',
    cardBg: '#FFFFFF',
    accent: '#E5A623',
    accentSoft: '#FFF0CC',
    border: '#F4E1B8',
    text: '#4A3720',
    muted: '#8A745A',
    placeholderBg: '#FFFBF3',
    placeholderBorder: '#D9C39B',
  },
  {
    id: 'lavender',
    title: 'Lavender',
    subtitle: 'Purple and gentle',
    icon: 'flower-outline',
    pageBg: '#F8F4FF',
    cardBg: '#FFFFFF',
    accent: '#8B6FD6',
    accentSoft: '#EDE5FF',
    border: '#DED2FA',
    text: '#34294D',
    muted: '#7A7191',
    placeholderBg: '#FBF9FF',
    placeholderBorder: '#BFB2DE',
  },
];

const templates = [
  {
    id: 'photo-left',
    title: 'Number + Text + Photo',
    subtitle: 'Number on the left, words in the middle, photo on the right',
    icon: 'albums-outline',
  },
  {
    id: 'photo-top',
    title: 'Photo Above',
    subtitle: 'Large photo above each step',
    icon: 'image-outline',
  },
  {
    id: 'text-only',
    title: 'Text Only',
    subtitle: 'Print the steps and add photos by hand',
    icon: 'document-text-outline',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function photoDataUri(photo) {
  if (!photo?.base64) return '';
  return `data:${photo.mimeType || 'image/jpeg'};base64,${photo.base64}`;
}

function titleFromFileName(fileName) {
  return String(fileName || '')
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[\s_-]*/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isImageFile(fileName) {
  return /\.(png|jpe?g|webp)$/i.test(String(fileName || ''));
}

function mimeTypeFromFileName(fileName) {
  const name = String(fileName || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function bytesToBase64(bytes) {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const d = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const triple = (a << 16) | (b << 8) | d;

    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[triple & 63] : '=';
  }

  return output;
}

// Personalize the display only; never overwrite parent-edited skill steps.
function personalizeStep(step, firstName) {
  const text = String(step || '').trim();
  if (!firstName || !text) return text;
  if (text.toLowerCase().startsWith(firstName.toLowerCase() + ' ')) return text;
  const verbs = {
    put: 'puts', pull: 'pulls', hold: 'holds', find: 'finds',
    push: 'pushes', keep: 'keeps', check: 'checks', bring: 'brings',
    wash: 'washes', dry: 'dries', gather: 'gathers', crack: 'cracks',
    use: 'uses', place: 'places', add: 'adds', pour: 'pours',
    cook: 'cooks', turn: 'turns', move: 'moves', clean: 'cleans',
    wait: 'waits', get: 'gets', start: 'starts', continue: 'continues',
    mix: 'mixes', open: 'opens', close: 'closes', zip: 'zips',
    insert: 'inserts', line: 'lines', repeat: 'repeats', look: 'looks',
    make: 'makes', take: 'takes', brush: 'brushes', apply: 'applies',
    wipe: 'wipes', eat: 'eats', practice: 'practices', prepare: 'prepares',
  };
  // Preserve introductory safety qualifiers such as "With adult support as needed".
  const match = text.match(/^(With adult support as needed,\s*|With adult help,\s*)?([A-Za-z]+)\b(.*)$/i);
  if (!match) return text;
  const [, qualifier = '', verb, rest] = match;
  const conjugated = verbs[verb.toLowerCase()];
  if (!conjugated) return text;
  return qualifier
    ? `${firstName} ${conjugated} ${rest.trimStart()} ${qualifier.trim().replace(/,$/, '')}.`.replace(/\.\.$/, '.')
    : `${firstName} ${conjugated}${rest}`;
}

export default function VisualTemplateBuilder() {
  const { profile } = useStudentProfile();
  const firstName = String(profile?.name || '').trim().split(/\s+/)[0] || '';
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId) ? skillId[0] : skillId;

  const [skill, setSkill] = useState(null);
  const [steps, setSteps] = useState([]);
  const [photos, setPhotos] = useState({});
  const [templateId, setTemplateId] = useState('photo-left');
  const [backgroundId, setBackgroundId] = useState('garden');
  const [firebaseBackgrounds, setFirebaseBackgrounds] = useState([]);
  const [backgroundsLoading, setBackgroundsLoading] = useState(true);
  const [backgroundsError, setBackgroundsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [photosRestored, setPhotosRestored] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Resolve older coat links to the official Firestore skill ID.
        const canonicalId = String(resolvedSkillId) === 'zip-winter-coat'
          ? 'zip-up-a-winter-coat'
          : String(resolvedSkillId);
        const skillSnap = await getDoc(doc(db, 'skills', canonicalId));
        const fallbackSkill = findIndependentStepsSkill(canonicalId)
          || findIndependentStepsSkill(resolvedSkillId);
        const loadedSkill = skillSnap.exists()
          ? { ...fallbackSkill, id: skillSnap.id, ...skillSnap.data() }
          : fallbackSkill;

        if (!loadedSkill) {
          setSkill(null);
          setSteps([]);
          return;
        }

        let nextSteps =
          Array.isArray(loadedSkill.steps) && loadedSkill.steps.length
            ? loadedSkill.steps
            : genericSteps;

        const user = auth.currentUser;
        if (user) {
          // Always prefer this parent's saved steps over the skill defaults.
          let customSnap = await getDoc(
            doc(db, 'users', user.uid, 'skillCustomizations', canonicalId)
          );
          // Retain customizations saved by older app versions.
          if (!customSnap.exists() && canonicalId === 'zip-up-a-winter-coat') {
            customSnap = await getDoc(
              doc(db, 'users', user.uid, 'skillCustomizations', 'zip-winter-coat')
            );
          }
          if (customSnap.exists() && Array.isArray(customSnap.data().steps)) {
            nextSteps = customSnap.data().steps.filter(
              (step) => typeof step === 'string' && step.trim().length > 0
            );
          }
        }

        setSkill(loadedSkill);
        setSteps(nextSteps);
      } catch (error) {
        console.error('Error loading visual template:', error);
        Alert.alert('Could not load skill', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedSkillId) load();
  }, [resolvedSkillId]);

  useEffect(() => {
    let active = true;

    const loadFirebaseBackgrounds = async () => {
      try {
        setBackgroundsLoading(true);
        setBackgroundsError('');

        const folder = storageRef(storage, 'visual-template-backgrounds');
        const result = await listAll(folder);
        const imageItems = result.items
          .filter((item) => isImageFile(item.name))
          .sort((a, b) => a.name.localeCompare(b.name));

        const loaded = await Promise.all(
          imageItems.map(async (item, index) => {
            const imageUrl = await getDownloadURL(item);
            const baseTheme = backgroundThemes[index % backgroundThemes.length];

            return {
              ...baseTheme,
              id: `firebase-${item.fullPath}`,
              title: titleFromFileName(item.name),
              subtitle: 'Firebase background',
              imageUrl,
              storagePath: item.fullPath,
              icon: 'image-outline',
            };
          })
        );

        if (!active) return;

        setFirebaseBackgrounds(loaded);

        if (loaded.length > 0) {
          setBackgroundId((current) =>
            current.startsWith('firebase-') ? current : loaded[0].id
          );
        }
      } catch (error) {
        console.error('Error loading Firebase template backgrounds:', error);
        if (active) {
          setBackgroundsError(
            'Firebase backgrounds could not load. Built-in backgrounds are still available.'
          );
        }
      } finally {
        if (active) setBackgroundsLoading(false);
      }
    };

    loadFirebaseBackgrounds();

    return () => {
      active = false;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === templateId) || templates[0],
    [templateId]
  );

  const backgroundOptions = useMemo(
    () => [...firebaseBackgrounds, ...backgroundThemes],
    [firebaseBackgrounds]
  );

  const selectedBackground = useMemo(
    () =>
      backgroundOptions.find((item) => item.id === backgroundId) ||
      backgroundOptions[0] ||
      backgroundThemes[0],
    [backgroundId, backgroundOptions]
  );

  // Parent photos are stored only on this device, never in Firebase.
  // Use the signed-in account in the key so accounts on one device do not mix.
  const localPhotoKey = `seeds-visual-photos-${auth.currentUser?.uid || 'guest'}-${String(resolvedSkillId) === 'zip-winter-coat' ? 'zip-up-a-winter-coat' : resolvedSkillId}`;

  useEffect(() => {
    if (loading || !skill) return;
    let cancelled = false;
    setPhotosRestored(false);
    const restore = async () => {
      try {
        let saved;
        if (Platform.OS === 'web') {
          saved = JSON.parse(window.localStorage.getItem(localPhotoKey) || 'null');
        } else {
          const folder = FileSystem.documentDirectory + 'seeds-visual-photos/';
          const path = folder + encodeURIComponent(localPhotoKey) + '.json';
          if (await FileSystem.getInfoAsync(path).then((info) => info.exists)) {
            saved = JSON.parse(await FileSystem.readAsStringAsync(path));
          }
        }
        if (!cancelled && saved?.entries) {
          const restored = {};
          for (const entry of saved.entries) {
            const index = steps.findIndex((step, i) => step === entry.step && !restored[i]);
            if (index < 0) continue;
            if (Platform.OS === 'web' && entry.dataUri) {
              restored[index] = { uri: entry.dataUri, base64: entry.dataUri.split(',')[1] || '', mimeType: entry.mimeType || 'image/jpeg' };
            } else if (Platform.OS !== 'web' && entry.fileName) {
              const uri = FileSystem.documentDirectory + 'seeds-visual-photos/' + entry.fileName;
              if ((await FileSystem.getInfoAsync(uri)).exists) {
                restored[index] = { uri, base64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }), mimeType: entry.mimeType || 'image/jpeg' };
              }
            }
          }
          if (!cancelled) setPhotos(restored);
        }
      } catch (error) {
        console.warn('Could not restore local visual photos:', error);
      } finally {
        if (!cancelled) setPhotosRestored(true);
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [loading, skill?.id, localPhotoKey, steps.join('\\u0001')]);

  async function savePhotosLocally() {
    if (!photosRestored || savingPhotos) return;
    setSavingPhotos(true);
    try {
      const entries = [];
      const folder = Platform.OS === 'web' ? '' : FileSystem.documentDirectory + 'seeds-visual-photos/';
      if (Platform.OS !== 'web') await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      for (let i = 0; i < steps.length; i++) {
        const photo = photos[i];
        if (!photo?.uri) continue;
        const mimeType = photo.mimeType || 'image/jpeg';
        let base64 = photo.base64;
        if (!base64 && Platform.OS !== 'web') {
          base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
        }
        if (!base64) throw new Error('Photo data unavailable for step ' + (i + 1));
        const entry = { step: steps[i], mimeType };
        if (Platform.OS === 'web') {
          entry.dataUri = `data:${mimeType};base64,${base64}`;
        } else {
          entry.fileName = encodeURIComponent(localPhotoKey) + '-step-' + i + (mimeType === 'image/png' ? '.png' : '.jpg');
          await FileSystem.writeAsStringAsync(folder + entry.fileName, base64, { encoding: FileSystem.EncodingType.Base64 });
        }
        entries.push(entry);
      }
      const manifest = JSON.stringify({ entries });
      if (Platform.OS === 'web') {
        window.localStorage.setItem(localPhotoKey, manifest);
        window.alert('Photos saved in this browser on this device.');
      } else {
        await FileSystem.writeAsStringAsync(folder + encodeURIComponent(localPhotoKey) + '.json', manifest);
        Alert.alert('Photos saved', 'Your photos are saved on this device only.');
      }
    } catch (error) {
      console.error('Save local visual photos failed:', error);
      const message = 'Could not save photos. Check available device or browser storage and try again.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Save failed', message);
    } finally {
      setSavingPhotos(false);
    }
  }

  async function choosePhoto(stepIndex) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo permission needed',
          'Allow photo access to choose a picture for this step. The selected photo stays on this device.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      setPhotos((current) => ({
        ...current,
        [stepIndex]: {
          uri: asset.uri,
          base64: asset.base64 || '',
          mimeType: asset.mimeType || 'image/jpeg',
        },
      }));
    } catch (error) {
      console.error('Photo picker error:', error);
      Alert.alert('Could not add photo', 'Please try again.');
    }
  }

  function removePhoto(stepIndex) {
    setPhotos((current) => {
      const next = { ...current };
      delete next[stepIndex];
      return next;
    });
  }

  async function getPrintableBackgroundDataUri() {
    if (!selectedBackground?.storagePath) return '';

    try {
      // Embed the image in the document: print/PDF renderers cannot reliably
      // access remote Firebase Storage URLs (especially on iOS).
      const bytes = await getBytes(
        storageRef(storage, selectedBackground.storagePath),
        25 * 1024 * 1024
      );
      return `data:${mimeTypeFromFileName(selectedBackground.storagePath)};base64,${bytesToBase64(new Uint8Array(bytes))}`;
    } catch (error) {
      console.error('Could not load the selected printable background:', error);
      throw new Error('The selected background could not be included in the PDF. Please try again.');
    }
  }

  function buildPrintableHtml(backgroundDataUri = '') {
    const theme = selectedBackground;
    const title = escapeHtml(skill?.title || 'Visual Schedule');

    const backgroundCss = backgroundDataUri
      ? `
          background-image:
            linear-gradient(rgba(255,255,255,0.12), rgba(255,255,255,0.12)),
            url("${backgroundDataUri}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        `
      : `background-color: ${theme.pageBg};`;

    const rows = steps
      .map((step, index) => {
        const dataUri = photoDataUri(photos[index]);

        const photoBlock =
          templateId === 'text-only'
            ? `
                <div class="photo placeholder">
                  <div class="placeholderIcon">＋</div>
                  <div>Add a photo here</div>
                </div>
              `
            : dataUri
              ? `<img class="photo" src="${dataUri}" alt="Step ${index + 1}" />`
              : `
                  <div class="photo placeholder">
                    <div class="placeholderIcon">＋</div>
                    <div>Add a photo here</div>
                  </div>
                `;

        if (templateId === 'photo-top') {
          return `
            <section class="stepCard top">
              <div class="stepHeading">
                <div class="stepNumber">${index + 1}</div>
                <div class="stepLabel">STEP ${index + 1}</div>
              </div>
              ${photoBlock}
              <div class="stepText">${escapeHtml(personalizeStep(step, firstName))}</div>
            </section>
          `;
        }

        return `
          <section class="stepCard row">
            <div class="stepNumber">${index + 1}</div>
            <div class="stepCopy">
              <div class="stepLabel">STEP ${index + 1}</div>
              <div class="stepText">${escapeHtml(personalizeStep(step, firstName))}</div>
            </div>
            ${photoBlock}
          </section>
        `;
      })
      .join('<!--STEP_BREAK-->');

    // Explicit page groups keep every step intact on iOS, Android and web.
    // Photo-above cards are taller, so they use a smaller per-page capacity.
    const firstPageCapacity = templateId === 'photo-top' ? 2 : 3;
    const laterPageCapacity = templateId === 'photo-top' ? 2 : 4;
    const stepMarkup = rows ? rows.split('<!--STEP_BREAK-->') : [];
    const pageGroups = [];
    let cursor = 0;
    while (cursor < stepMarkup.length) {
      const capacity = pageGroups.length === 0 ? firstPageCapacity : laterPageCapacity;
      pageGroups.push(stepMarkup.slice(cursor, cursor + capacity));
      cursor += capacity;
    }
    if (!pageGroups.length) pageGroups.push([]);
    const pages = pageGroups.map((group, pageIndex) => `
      <main class="page">
        ${pageIndex === 0 ? `
          <header class="headerCard">
            <div class="eyebrow">Independent Steps</div>
            <h1>${title}</h1>
            <div class="headerSub">
              Follow one step at a time. Keep the page nearby while practicing.
            </div>
          </header>` : ''}
        <div class="steps">${group.join('')}</div>
        <footer class="footer">For privacy considerations, photos are saved only on this device.</footer>
      </main>
    `).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            @page {
              size: letter portrait;
              margin: 0;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
              color: ${theme.text};
              background: ${theme.pageBg};
            }

            .page {
              height: 11in;
              width: 8.5in;
              padding: 0.38in;
              position: relative;
              overflow: hidden;
              page-break-after: always;
              break-after: page;
              ${backgroundCss}
            }

            .page:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            .headerCard {
              background: rgba(255,255,255,0.93);
              border: 2px solid ${theme.border};
              border-radius: 26px;
              padding: 22px 24px;
              margin-bottom: 18px;
              box-shadow: 0 7px 18px rgba(31,42,55,0.10);
              page-break-inside: avoid;
            }

            .eyebrow {
              display: inline-block;
              padding: 6px 11px;
              border-radius: 999px;
              background: ${theme.accentSoft};
              color: ${theme.accent};
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 1.15px;
              text-transform: uppercase;
            }

            h1 {
              margin: 10px 0 5px;
              font-size: 28px;
              line-height: 1.15;
              color: ${theme.text};
            }

            .headerSub {
              color: ${theme.muted};
              font-size: 13px;
              line-height: 1.5;
            }

            .chips {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: 13px;
            }

            .chip {
              border-radius: 999px;
              border: 1px solid ${theme.border};
              background: rgba(255,255,255,0.90);
              padding: 6px 10px;
              color: ${theme.text};
              font-size: 10px;
              font-weight: 700;
            }

            .steps {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .stepCard {
              width: 100%;
              min-height: 1.65in;
              background: rgba(255,255,255,0.82);
              border: 2px solid ${theme.border};
              border-radius: 18px;
              padding: 12px;
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: 0 5px 14px rgba(31,42,55,0.08);
            }

            .stepCard.row {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
            }

            .stepCard.top {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .stepHeading {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 9px;
            }

            .stepNumber {
              width: 46px;
              height: 46px;
              min-width: 46px;
              border-radius: 50%;
              background: ${theme.accent};
              color: #ffffff;
              font-size: 20px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .stepCopy {
              flex: 1;
              min-width: 0;
            }

            .stepLabel {
              color: ${theme.accent};
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }

            .stepText {
              color: ${theme.text};
              font-size: 16px;
              line-height: 1.3;
              font-weight: 750;
            }

            .photo {
              width: 1.75in;
              height: 1.25in;
              flex-shrink: 0;
              object-fit: cover;
              border-radius: 15px;
              border: 1px solid ${theme.border};
              background: ${theme.placeholderBg};
            }

            .stepCard.top .photo {
              width: 100%;
              height: 2.0in;
            }

            .placeholder {
              border: 2px dashed ${theme.placeholderBorder};
              background: rgba(255,255,255,0.65);
              color: ${theme.muted};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 11px;
              font-weight: 700;
            }

            .placeholderIcon {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              margin-bottom: 6px;
              background: ${theme.accentSoft};
              color: ${theme.accent};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            }

            .footer {
              position: absolute;
              bottom: 0.20in;
              left: 0.38in;
              right: 0.38in;
              padding: 8px 12px;
              border-radius: 15px;
              background: rgba(255,255,255,0.88);
              border: 1px solid ${theme.border};
              color: ${theme.muted};
              font-size: 9px;
              line-height: 1.45;
              text-align: center;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          ${pages}
        </body>
      </html>
    `;
  }

  async function createPrintableHtml() {
    const backgroundDataUri = await getPrintableBackgroundDataUri();
    return buildPrintableHtml(backgroundDataUri);
  }

  function openWebPrintableDocument(html) {
    if (typeof window === 'undefined') return false;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.alert('Allow pop-ups for this site, then try again.');
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const startPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (error) {
        console.error('Browser print error:', error);
      }
    };

    // Wait for embedded images and layout before invoking the print dialog.
    const images = Array.from(printWindow.document.images);
    Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })).then(() => setTimeout(startPrint, 400));
    return true;
  }

  async function printTemplate() {
    if (Platform.OS === 'web') {
      try {
        setWorking(true);
        const html = await createPrintableHtml();
        openWebPrintableDocument(html);
      } catch (error) {
        console.error('Print template error:', error);
        window.alert(error.message || 'Could not prepare the printable background.');
      } finally {
        setWorking(false);
      }
      return;
    }

    try {
      setWorking(true);
      const html = await createPrintableHtml();
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print template error:', error);
      Alert.alert('Could not print', 'Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function shareTemplate() {
    if (Platform.OS === 'web') {
      try {
        setWorking(true);
        const html = await createPrintableHtml();
        const opened = openWebPrintableDocument(html);
        if (opened) window.alert('In the print dialog, choose "Save as PDF" to save or share.');
      } catch (error) {
        console.error('PDF template error:', error);
        window.alert(error.message || 'Could not prepare the PDF background.');
      } finally {
        setWorking(false);
      }
      return;
    }

    try {
      setWorking(true);
      const html = await createPrintableHtml();

      const result = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          'Sharing unavailable',
          'PDF sharing is not available on this device.'
        );
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${skill?.title || 'Skill'} visual template`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Share template error:', error);
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: selectedBackground.pageBg }]}>
        <ActivityIndicator size="large" color={selectedBackground.accent} />
        <Text style={[s.centerText, { color: selectedBackground.muted }]}>
          Loading template...
        </Text>
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={[s.center, { backgroundColor: selectedBackground.pageBg }]}>
        <Text style={[s.errorTitle, { color: selectedBackground.text }]}>
          Skill not found
        </Text>
        <Pressable
          style={[s.primaryButton, { backgroundColor: selectedBackground.accent }]}
          onPress={() => router.back()}
        >
          <Text style={s.primaryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.page, { backgroundColor: selectedBackground.pageBg }]}
      contentContainerStyle={s.content}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.headerTitle}>Visual Template</Text>
        <View style={{ width: 28 }} />
      </View>

      <View
        style={[
          s.privacyCard,
          {
            backgroundColor: selectedBackground.accentSoft,
            borderColor: selectedBackground.border,
          },
        ]}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={24}
          color={selectedBackground.accent}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.privacyTitle, { color: selectedBackground.text }]}>
            Photos stay private
          </Text>
          <Text style={[s.privacyText, { color: selectedBackground.muted }]}>
            For privacy considerations, photos are saved only on this device.
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>1. Choose a background</Text>
      {backgroundsLoading && (
        <View style={s.backgroundStatus}>
          <ActivityIndicator size="small" color="#7559E8" />
          <Text style={s.backgroundStatusText}>Loading Firebase backgrounds...</Text>
        </View>
      )}
      {!!backgroundsError && (
        <Text style={s.backgroundError}>{backgroundsError}</Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.themeRow}
      >
        {backgroundOptions.map((theme) => {
          const selected = theme.id === backgroundId;
          return (
            <Pressable
              key={theme.id}
              onPress={() => setBackgroundId(theme.id)}
              style={[
                s.themeCard,
                {
                  backgroundColor: theme.pageBg,
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}
            >
              {theme.imageUrl ? (
                <ImageBackground
                  source={{ uri: theme.imageUrl }}
                  style={s.themePreviewImage}
                  imageStyle={s.themePreviewImageInner}
                >
                  <View style={s.themePreviewShade}>
                    <Ionicons name="image-outline" size={24} color="#FFFFFF" />
                  </View>
                </ImageBackground>
              ) : (
                <View
                  style={[
                    s.themePreview,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={[s.themePreviewCircle, { backgroundColor: theme.accentSoft }]}
                  />
                  <View
                    style={[s.themePreviewBar, { backgroundColor: theme.border }]}
                  />
                  <View
                    style={[
                      s.themePreviewBar,
                      { backgroundColor: theme.border, width: '68%' },
                    ]}
                  />
                </View>
              )}

              <Ionicons name={theme.icon} size={22} color={theme.accent} />
              <Text style={[s.themeTitle, { color: theme.text }]}>{theme.title}</Text>
              <Text style={[s.themeSubtitle, { color: theme.muted }]}>
                {theme.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={s.sectionTitle}>2. Choose a layout</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.templateRow}
      >
        {templates.map((template) => {
          const selected = template.id === templateId;
          return (
            <Pressable
              key={template.id}
              onPress={() => setTemplateId(template.id)}
              style={[
                s.templateCard,
                {
                  backgroundColor: selectedBackground.cardBg,
                  borderColor: selected
                    ? selectedBackground.accent
                    : selectedBackground.border,
                },
                selected && { backgroundColor: selectedBackground.pageBg },
              ]}
            >
              <Ionicons
                name={template.icon}
                size={28}
                color={selected ? selectedBackground.accent : selectedBackground.muted}
              />
              <Text style={[s.templateTitle, { color: selectedBackground.text }]}>
                {template.title}
              </Text>
              <Text style={[s.templateSubtitle, { color: selectedBackground.muted }]}>
                {template.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.previewHeader}>
        <View>
          <Text style={s.sectionTitle}>3. Add photos and preview</Text>
          <Text style={[s.previewHint, { color: selectedBackground.muted }]}>
            {selectedTemplate.subtitle}
          </Text>
        </View>
        <Text style={[s.stepCount, { color: selectedBackground.accent }]}>
          {steps.length} steps
        </Text>
      </View>

      {steps.map((step, index) => {
        const photo = photos[index];
        return (
          <View
            key={`${index}-${step}`}
            style={[
              s.stepCard,
              {
                backgroundColor: selectedBackground.cardBg,
                borderColor: selectedBackground.border,
              },
              templateId === 'photo-top' && s.stepCardTop,
            ]}
          >
            <View
              style={[
                s.numberBubble,
                { backgroundColor: selectedBackground.accentSoft },
              ]}
            >
              <Text style={[s.numberText, { color: selectedBackground.accent }]}>
                {index + 1}
              </Text>
            </View>

            <View style={s.stepTextWrap}>
              <Text style={[s.stepText, { color: selectedBackground.text }]}>
                {personalizeStep(step, firstName)}
              </Text>
              {templateId !== 'text-only' && photo?.uri && (
                <Pressable onPress={() => choosePhoto(index)}>
                  <Text
                    style={[s.changePhotoText, { color: selectedBackground.accent }]}
                  >
                    Change photo
                  </Text>
                </Pressable>
              )}
            </View>

            {templateId !== 'text-only' && (
              <View
                style={[
                  s.photoWrap,
                  templateId === 'photo-top' && s.photoWrapTop,
                ]}
              >
                {photo?.uri ? (
                  <>
                    <Image source={{ uri: photo.uri }} style={s.photo} />
                    <Pressable
                      style={s.removePhoto}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[
                      s.photoPlaceholder,
                      {
                        backgroundColor: selectedBackground.placeholderBg,
                        borderColor: selectedBackground.placeholderBorder,
                      },
                    ]}
                    onPress={() => choosePhoto(index)}
                  >
                    <Ionicons
                      name="image-outline"
                      size={30}
                      color={selectedBackground.muted}
                    />
                    <Text
                      style={[
                        s.photoPlaceholderText,
                        { color: selectedBackground.muted },
                      ]}
                    >
                      Add photo
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={s.actions}>
        <Pressable
          style={[s.primaryButton, { backgroundColor: '#7559E8' }, (!photosRestored || savingPhotos) && s.disabled]}
          onPress={savePhotosLocally}
          disabled={!photosRestored || savingPhotos}
        >
          <Ionicons name="save-outline" size={20} color="#FFFFFF" />
          <Text style={s.primaryText}>{savingPhotos ? 'Saving Photos...' : 'Save Photos on This Device'}</Text>
        </Pressable>
        <Pressable
          style={[
            s.primaryButton,
            { backgroundColor: selectedBackground.accent },
            working && s.disabled,
          ]}
          onPress={printTemplate}
          disabled={working}
        >
          <Ionicons name="print-outline" size={20} color="#FFFFFF" />
          <Text style={s.primaryText}>Print Template</Text>
        </Pressable>

        <Pressable
          style={[
            s.secondaryButton,
            {
              backgroundColor: selectedBackground.cardBg,
              borderColor: selectedBackground.border,
            },
            working && s.disabled,
          ]}
          onPress={shareTemplate}
          disabled={working}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={selectedBackground.accent}
          />
          <Text style={[s.secondaryText, { color: selectedBackground.accent }]}>
            Share PDF
          </Text>
        </Pressable>
      </View>

      <Text style={[s.localNote, { color: selectedBackground.muted }]}>
        Tap Save Photos to keep selected photos on this device for next time.
        Unsaved changes are lost when you leave. No child photos are uploaded to Firebase.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingBottom: 46 },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17213A',
  },

  privacyCard: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  privacyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  privacyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },

  sectionTitle: {
    marginHorizontal: 18,
    fontSize: 19,
    fontWeight: '800',
    color: '#17213A',
  },

  backgroundStatus: {
    marginHorizontal: 18,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  backgroundStatusText: {
    fontSize: 12,
    color: '#716A89',
  },

  backgroundError: {
    marginHorizontal: 18,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: '#A15C00',
  },

  themeRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },

  themeCard: {
    width: 168,
    minHeight: 150,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
  },

  themePreviewImage: {
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },

  themePreviewImageInner: {
    borderRadius: 12,
  },

  themePreviewShade: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  themePreview: {
    height: 76,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    justifyContent: 'center',
  },

  themePreviewCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 6,
  },

  themePreviewBar: {
    height: 6,
    borderRadius: 4,
    width: '82%',
    marginBottom: 5,
  },

  themeTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
  },

  themeSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },

  templateRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },

  templateCard: {
    width: 176,
    minHeight: 132,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
  },

  templateTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '800',
  },

  templateSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },

  previewHeader: {
    marginTop: 8,
    marginBottom: 12,
    paddingRight: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  previewHint: {
    marginLeft: 18,
    marginTop: 4,
    fontSize: 12,
  },

  stepCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  stepCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 106,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  stepCardTop: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  numberBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    fontWeight: '800',
  },

  photoWrap: {
    width: 105,
    height: 86,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },

  photoWrapTop: {
    width: '100%',
    height: 165,
  },

  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  photoPlaceholder: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPlaceholderText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
  },

  removePhoto: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepTextWrap: {
    flex: 1,
  },

  stepText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },

  changePhotoText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },

  actions: {
    marginHorizontal: 16,
    marginTop: 8,
    gap: 10,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  secondaryText: {
    fontWeight: '800',
    fontSize: 16,
  },

  disabled: {
    opacity: 0.55,
  },

  localNote: {
    marginHorizontal: 22,
    marginTop: 14,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  centerText: {
    marginTop: 10,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
});