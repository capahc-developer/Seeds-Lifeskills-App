import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { auth, db } from '../../../lib/firebase';
import { findIndependentStepsSkill } from '../../../data/independentStepsSkills';

const genericSteps = [
  'Get ready and gather what you need.',
  'Start the first part of the skill.',
  'Continue through the task one step at a time.',
  'Check that the task is complete.',
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

export default function VisualTemplateBuilder() {
  const { skillId } = useLocalSearchParams();
  const resolvedSkillId = Array.isArray(skillId) ? skillId[0] : skillId;

  const [skill, setSkill] = useState(null);
  const [steps, setSteps] = useState([]);
  const [photos, setPhotos] = useState({});
  const [templateId, setTemplateId] = useState('photo-left');
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

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === templateId) || templates[0],
    [templateId]
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
        mediaTypes: ['images'],
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
    const rows = steps
      .map((step, index) => {
        const photo = photos[index];
        const dataUri = photoDataUri(photo);
        const imageBlock =
          templateId === 'text-only'
            ? '<div class="photo placeholder">Add photo here</div>'
            : dataUri
              ? `<img class="photo" src="${dataUri}" />`
              : '<div class="photo placeholder">Add photo here</div>';

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
              color: #17213A;
              background: #ffffff;
            }
            h1 { text-align: center; color: #315C42; margin: 0 0 8px; }
            .sub {
              text-align: center;
              color: #657184;
              margin-bottom: 24px;
            }
            .privacy {
              text-align: center;
              font-size: 11px;
              color: #7A8495;
              margin-bottom: 18px;
            }
            .step {
              page-break-inside: avoid;
              border: 2px solid #DCEBE2;
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
              background: #E3F3E9;
              color: #315C42;
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
              background: #F2F5F3;
            }
            .step.top .photo {
              width: 100%;
              height: 240px;
            }
            .placeholder {
              border: 2px dashed #A9BDB0;
              color: #7A8C80;
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
      <View style={s.center}>
        <ActivityIndicator size="large" color="#45A66B" />
        <Text style={s.centerText}>Loading template...</Text>
      </View>
    );
  }

  if (!skill) {
    return (
      <View style={s.center}>
        <Text style={s.errorTitle}>Skill not found</Text>
        <Pressable style={s.primaryButton} onPress={() => router.back()}>
          <Text style={s.primaryText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#17213A" />
        </Pressable>
        <Text style={s.headerTitle}>Visual Template</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.privacyCard}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#2F7D51" />
        <View style={{ flex: 1 }}>
          <Text style={s.privacyTitle}>Photos stay private</Text>
          <Text style={s.privacyText}>
            Photos you choose stay on this device. They are not uploaded to Firebase
            and are not sent to the AI assistant.
          </Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Choose a template</Text>
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
              style={[s.templateCard, selected && s.templateSelected]}
            >
              <Ionicons
                name={template.icon}
                size={28}
                color={selected ? '#2F7D51' : '#718096'}
              />
              <Text style={s.templateTitle}>{template.title}</Text>
              <Text style={s.templateSubtitle}>{template.subtitle}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.previewHeader}>
        <View>
          <Text style={s.sectionTitle}>Preview</Text>
          <Text style={s.previewHint}>{selectedTemplate.subtitle}</Text>
        </View>
        <Text style={s.stepCount}>{steps.length} steps</Text>
      </View>

      {steps.map((step, index) => {
        const photo = photos[index];
        return (
          <View
            key={`${index}-${step}`}
            style={[
              s.stepCard,
              templateId === 'photo-top' && s.stepCardTop,
            ]}
          >
            <View style={s.numberBubble}>
              <Text style={s.numberText}>{index + 1}</Text>
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
                    style={s.photoPlaceholder}
                    onPress={() => choosePhoto(index)}
                  >
                    <Ionicons name="image-outline" size={26} color="#6E8C78" />
                    <Text style={s.photoPlaceholderText}>Add photo</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={s.stepTextWrap}>
              <Text style={s.stepText}>{step}</Text>
              {templateId !== 'text-only' && photo?.uri && (
                <Pressable onPress={() => choosePhoto(index)}>
                  <Text style={s.changePhotoText}>Change photo</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      <View style={s.actions}>
        <Pressable
          style={[s.primaryButton, working && s.disabled]}
          onPress={printTemplate}
          disabled={working}
        >
          <Ionicons name="print-outline" size={20} color="#FFFFFF" />
          <Text style={s.primaryText}>Print Template</Text>
        </Pressable>

        <Pressable
          style={[s.secondaryButton, working && s.disabled]}
          onPress={shareTemplate}
          disabled={working}
        >
          <Ionicons name="share-outline" size={20} color="#2F7D51" />
          <Text style={s.secondaryText}>Share PDF</Text>
        </Pressable>
      </View>

      <Text style={s.localNote}>
        Closing this screen clears the selected photos from the app session. No child
        photo data is written to Firestore or Firebase Storage.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3FAF6' },
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
  privacyCard: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#EAF7EF',
    borderWidth: 1,
    borderColor: '#CCE7D5',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyTitle: { fontSize: 15, fontWeight: '800', color: '#315C42' },
  privacyText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#5F6F64',
  },
  sectionTitle: {
    marginHorizontal: 18,
    fontSize: 19,
    fontWeight: '800',
    color: '#17213A',
  },
  templateRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  templateCard: {
    width: 176,
    minHeight: 132,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8E4',
  },
  templateSelected: {
    borderColor: '#45A66B',
    backgroundColor: '#F1FAF4',
  },
  templateTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#17213A',
  },
  templateSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#718096',
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
    color: '#718096',
    fontSize: 12,
  },
  stepCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#438A6A',
  },
  stepCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 138,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFEAE3',
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
    backgroundColor: '#E3F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontWeight: '800', color: '#315C42' },
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
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#AFC4B5',
    backgroundColor: '#F5F9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#6E8C78',
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
  stepTextWrap: { flex: 1 },
  stepText: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: '#243247',
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#258DEB',
  },
  actions: {
    marginHorizontal: 16,
    marginTop: 8,
    gap: 10,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: '#45A66B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE2D5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: { color: '#2F7D51', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.55 },
  localNote: {
    marginHorizontal: 22,
    marginTop: 14,
    textAlign: 'center',
    color: '#7D8A80',
    fontSize: 11,
    lineHeight: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#F3FAF6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  centerText: { marginTop: 10, color: '#718096' },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#17213A' },
});
