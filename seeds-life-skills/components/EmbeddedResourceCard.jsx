import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

function normalizeResource(resource) {
  if (!resource) return null;

  if (typeof resource === 'string') {
    return {
      title: 'Open resource',
      url: resource,
      type: 'link',
    };
  }

  if (!resource.url) return null;

  return {
    title: resource.title || 'Open resource',
    description: resource.description || '',
    url: resource.url,
    type: resource.type || resource.kind || 'link',
  };
}

export default function EmbeddedResourceCard({ resource, compact = false }) {
  const item = normalizeResource(resource);
  if (!item) return null;

  const isVideo =
    item.type === 'video' ||
    /youtube\.com|youtu\.be|vimeo\.com/i.test(item.url);

  const openResource = async () => {
    try {
      await WebBrowser.openBrowserAsync(item.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: '#258DEB',
      });
    } catch (error) {
      console.error('Could not open resource:', error);
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={item.title}
      onPress={openResource}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, isVideo && styles.videoIcon]}>
        <Ionicons
          name={isVideo ? 'play' : 'link-outline'}
          size={20}
          color={isVideo ? '#B42318' : '#258DEB'}
        />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{item.title}</Text>
        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <Text style={styles.action}>
          {isVideo ? 'Watch video' : 'Open link'}
        </Text>
      </View>

      <Ionicons name="open-outline" size={20} color="#718096" />
    </Pressable>
  );
}

export function ResourceList({ resources = [], compact = false }) {
  const valid = resources.filter((item) =>
    typeof item === 'string' ? item : item?.url
  );

  if (!valid.length) return null;

  return (
    <View style={styles.list}>
      {valid.map((resource, index) => (
        <EmbeddedResourceCard
          key={
            typeof resource === 'string'
              ? resource
              : resource.id || resource.url || index
          }
          resource={resource}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    minHeight: 76,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#DDE8F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardCompact: {
    minHeight: 66,
    padding: 11,
  },
  pressed: {
    opacity: 0.72,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    backgroundColor: '#FFF0EE',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17213A',
  },
  description: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: '#718096',
  },
  action: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '800',
    color: '#258DEB',
  },
});
