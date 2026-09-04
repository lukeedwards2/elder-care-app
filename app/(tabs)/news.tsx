import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../../components/NavHeader';

type Article = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  readTime: string;
  image: string;
};

export default function NewsScreen() {
  const router = useRouter();

  const [helpVisible, setHelpVisible] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const articles: Article[] = [
    {
      id: 'staying-active',
      title: 'Tips for Staying Active',
      description:
        'Simple daily movements that can help maintain strength, balance, and flexibility.',
      content:
        'Staying active as a senior does not have to mean strenuous exercise. Walking, stretching, light household tasks, and other gentle activities can be great ways to maintain strength and flexibility. Small amounts of movement throughout the day can add up and help make everyday activities easier.',
      category: 'Wellness',
      readTime: '3 min read',
      image:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'nutrition-after-60',
      title: 'Nutrition After 60',
      description:
        'A few simple ways to make everyday meals more nutritious and balanced.',
      content:
        'As we age, our nutritional needs can change. Choosing a variety of fruits, vegetables, whole grains, lean proteins, and other nutrient-rich foods can help support overall wellness. Staying hydrated is important too, especially because feelings of thirst may become less noticeable with age.',
      category: 'Nutrition',
      readTime: '4 min read',
      image:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=80',
    },
    {
      id: 'social-connection',
      title: 'Social Connection Matters',
      description:
        'How staying connected with friends, family, and community can support well-being.',
      content:
        'Social connection can play an important role in overall well-being. Calling a friend, spending time with family, joining a group, attending community activities, or simply taking a walk with someone can create meaningful opportunities to stay connected.',
      category: 'Lifestyle',
      readTime: '3 min read',
      image:
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
    },
  ];

  const handleImageError = (articleId: string) => {
    setFailedImages((current) => ({
      ...current,
      [articleId]: true,
    }));
  };

  const openArticle = (item: Article) => {
    router.push({
      pathname: '/(tabs)/newsDetail',
      params: {
        title: item.title,
        description: item.description,
        content: item.content,
        category: item.category,
        readTime: item.readTime,
        image: item.image,
      },
    });
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpIconCircle}>
              <Ionicons
                name="newspaper-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.helpTitle}>Senior News</Text>

            <Text style={styles.helpText}>
              Explore helpful articles about healthy aging, wellness,
              nutrition, activity, and staying socially connected.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.gotItText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>Senior News</Text>

              <Text style={styles.pageSubtitle}>
                Helpful reads for healthy, connected living.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setHelpVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.helpButtonText}>?</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => openArticle(item)}
          >
            <View style={styles.imageArea}>
              {!failedImages[item.id] ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => handleImageError(item.id)}
                />
              ) : (
                <View style={styles.imageFallback}>
                  <View style={styles.fallbackIconCircle}>
                    <Ionicons
                      name="newspaper-outline"
                      size={38}
                      color="#1976D2"
                    />
                  </View>
                </View>
              )}

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>

              <Text style={styles.description}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.readTimeRow}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color="#7A8798"
                  />
                  <Text style={styles.readTime}>{item.readTime}</Text>
                </View>

                <View style={styles.readArticleRow}>
                  <Text style={styles.readArticleText}>Read article</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#1976D2"
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 20,
  },

  pageHeaderText: {
    flex: 1,
    paddingRight: 16,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#17202D',
    letterSpacing: -0.5,
  },

  pageSubtitle: {
    fontSize: 16,
    color: '#8290A3',
    marginTop: 5,
    lineHeight: 22,
  },

  helpButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpButtonText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1976D2',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 18,
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

  imageArea: {
    height: 190,
    position: 'relative',
    backgroundColor: '#EAF3FD',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackIconCircle: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
  },

  categoryText: {
    color: '#1976D2',
    fontWeight: '700',
    fontSize: 13,
  },

  textContainer: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 16,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17202D',
    marginBottom: 7,
  },

  description: {
    fontSize: 15,
    lineHeight: 21,
    color: '#68778A',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EDF0F4',
    marginTop: 16,
    paddingTop: 14,
  },

  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  readTime: {
    color: '#7A8798',
    fontSize: 13,
    marginLeft: 5,
  },

  readArticleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  readArticleText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 25, 38, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  helpCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  helpIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  helpTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#17202D',
    marginBottom: 10,
  },

  helpText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
    color: '#68778A',
    marginBottom: 22,
  },

  gotItButton: {
    width: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  gotItText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});



