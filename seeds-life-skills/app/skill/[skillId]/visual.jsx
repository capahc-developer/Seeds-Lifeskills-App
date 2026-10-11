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
import { getDownloadURL, listAll, ref as storageRef } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { auth, db, storage } from '../../../lib/firebase';
import { findIndependentStepsSkill } from '../../../data/independentStepsSkills';

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
    title: 'Photo + Text',
    subtitle: 'Photo on the left, words on the right',
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
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isImageFile(fileName) {
  return /\.(png|jpe?g|webp)$/i.test(String(fileName || ''));
}

export default function VisualTemplateBuilder() {
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const fallbackSkill = findIndependentStepsSkill(resolvedSkillId);
        const skillSnap = await getDoc(doc(db, 'skills', String(resolvedSkillId)));

        if (!skillSnap.exists() && !fallbackSkill) {
          setSkill(null);
          setSteps([]);
          return;
        }

        const loadedSkill = skillSnap.exists()
          ? {
              ...fallbackSkill,
              id: skillSnap.id,
              ...skillSnap.data(),
            }
          : fallbackSkill;

        let nextSteps =
          Array.isArray(loadedSkill.steps) && loadedSkill.steps.length
            ? loadedSkill.steps
            : genericSteps;

        const user = auth.currentUser;
        if (user) {
          const customSnap = await getDoc(
            doc(
              db,
              'users',
              user.uid,
              'skillCustomizations',
              String(resolvedSkillId)
            )
          );

          if (
            customSnap.exists() &&
            Array.isArray(customSnap.data().steps) &&
            customSnap.data().steps.length
          ) {
            nextSteps = customSnap.data().steps;
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
        const imageItems = result.items.filter((item) => isImageFile(item.name));

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

  function buildHtml() {
    const theme = selectedBackground;

    const rows = steps
      .map((step, index) => {
        const photo = photos[index];
        const dataUri = photoDataUri(photo);

        const imageBlock =
          templateId === 'text-only'
            ? `<div class="photo placeholder">Add photo here</div>`
            : dataUri
              ? `<img class="photo" src="${dataUri}" />`
              : `<div class="photo placeholder">Add photo here</div>`;

        if (templateId === 'photo-top') {
          return `
            <div class="step top">
              <div class="number">${index + 1}</div>
              ${imageBlock}
              <div class="stepText">${escapeHtml(step)}</div>
            </div>
          `;
        }

        return `
          <div class="step row">
            <div class="number">${index + 1}</div>
            ${imageBlock}
            <div class="stepText">${escapeHtml(step)}</div>
          </div>
        `;
      })
      .join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              margin: 0;
              padding: 26px;
              color: ${theme.text};
              background-color: ${theme.pageBg};
              ${theme.imageUrl ? `background-image: linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url("${theme.imageUrl}"); background-size: cover; background-position: center; background-attachment: fixed;` : ''}
            }
            h1 { text-align: center; color: ${theme.accent}; margin: 0 0 8px; }
            .sub {
              text-align: center;
              color: ${theme.muted};
              margin-bottom: 24px;
            }
            .privacy {
              text-align: center;
              font-size: 11px;
              color: ${theme.muted};
              margin-bottom: 18px;
            }
            .step {
              page-break-inside: avoid;
              border: 2px solid ${theme.border};
              background: ${theme.cardBg};
              border-radius: 18px;
              padding: 16px;
              margin: 0 0 16px;
              position: relative;
              min-height: 150px;
            }
            .step.row {
              display: flex;
              align-items: center;
              gap: 18px;
            }
            .step.top {
              display: flex;
              flex-direction: column;
              align-items: stretch;
              gap: 12px;
            }
            .number {
              width: 38px;
              height: 38px;
              min-width: 38px;
              border-radius: 19px;
              background: ${theme.accentSoft};
              color: ${theme.accent};
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
            }
            .photo {
              width: 180px;
              height: 130px;
              object-fit: cover;
              border-radius: 12px;
              background: ${theme.placeholderBg};
            }
            .step.top .photo {
              width: 100%;
              height: 240px;
            }
            .placeholder {
              border: 2px dashed ${theme.placeholderBorder};
              color: ${theme.muted};
              background: ${theme.placeholderBg};
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 14px;
            }
            .stepText {
              flex: 1;
              font-size: 22px;
              line-height: 1.35;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(skill?.title || 'Visual Schedule')}</h1>
          <div class="sub">Independent Steps visual schedule</div>
          <div class="privacy">Photos in this template are processed locally on this device and are not uploaded to Firebase.</div>
          ${rows}
        </body>
      </html>
    `;
  }

  async function printTemplate() {
    try {
      setWorking(true);
      await Print.printAsync({ html: buildHtml() });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Could not print', 'Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function shareTemplate() {
    try {
      setWorking(true);
      const result = await Print.printToFileAsync({
        html: buildHtml(),
        base64: false,
      });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          'Sharing unavailable',
          Platform.OS === 'web'
            ? 'Local PDF sharing is not available in this browser.'
            : 'Sharing is not available on this device.'
        );
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${skill?.title || 'Skill'} visual schedule`,
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
            Photos you choose stay on this device. They are not uploaded to Firebase
            and are not sent to the AI assistant.
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
                      size={26}
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

            <View style={s.stepTextWrap}>
              <Text style={[s.stepText, { color: selectedBackground.text }]}>
                {step}
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
          </View>
        );
      })}

      <View style={s.actions}>
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
        Closing this screen clears the selected photos from the app session. No child
        photo data is written to Firestore or Firebase Storage.
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
    minHeight: 138,
    padding: 14,
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
    width: 112,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },

  photoWrapTop: {
    width: '100%',
    height: 210,
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
    fontSize: 18,
    lineHeight: 25,
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