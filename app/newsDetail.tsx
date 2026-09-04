import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

export default function NewsDetail() {
  const router = useRouter();

  const {
    title,
    description,
    content,
    image,
    category,
    readTime,
  } = useLocalSearchParams();

  const [imageFailed, setImageFailed] = useState(false);

  const handleBack = () => {
    router.replace('/(tabs)/news');
  };

  return (
    <View style={styles.screen}>
      <NavHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#1976D2"
          />
          <Text style={styles.backText}>Senior News</Text>
        </TouchableOpacity>

        <View style={styles.articleCard}>
          {!imageFailed && image ? (
            <Image
              source={{ uri: image as string }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={styles.imageFallback}>
              <View style={styles.fallbackIcon}>
                <Ionicons
                  name="newspaper-outline"
                  size={44}
                  color="#1976D2"
                />
              </View>
            </View>
          )}

          <View style={styles.articleBody}>
            <View style={styles.metaRow}>
              {category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {category}
                  </Text>
                </View>
              ) : null}

              {readTime ? (
                <View style={styles.readTimeRow}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color="#7A8798"
                  />
                  <Text style={styles.readTimeText}>
                    {readTime}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.description}>
              {description}
            </Text>

            <View style={styles.divider} />

            <Text style={styles.content}>
              {content}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.returnButtonText}>
            Back to Senior News
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 4,
  },

  backText: {
    color: '#1976D2',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 2,
  },

  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E6EC',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  image: {
    width: '100%',
    height: 240,
  },

  imageFallback: {
    height: 220,
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackIcon: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  articleBody: {
    padding: 22,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  categoryBadge: {
    backgroundColor: '#EAF3FD',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },

  categoryText: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '700',
  },

  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  readTimeText: {
    color: '#7A8798',
    fontSize: 13,
    marginLeft: 5,
  },

  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: '#17202D',
    letterSpacing: -0.4,
  },

  description: {
    fontSize: 17,
    lineHeight: 24,
    color: '#68778A',
    marginTop: 10,
    fontStyle: 'italic',
  },

  divider: {
    height: 1,
    backgroundColor: '#E8ECF1',
    marginVertical: 22,
  },

  content: {
    fontSize: 17,
    lineHeight: 28,
    color: '#303A46',
  },

  returnButton: {
    backgroundColor: '#1976D2',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
