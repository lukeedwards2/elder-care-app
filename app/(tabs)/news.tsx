import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '../../components/NavHeader';

export default function NewsScreen() {
  const router = useRouter();
  const [articles] = useState([
    {
      title: 'Tips for Staying Active',
      description: 'Simple daily movements to keep your body strong.',
      content:
        'Staying active as a senior doesn’t mean strenuous exercise. Walking, stretching, and light household tasks are great ways to maintain strength and flexibility...',
      image:
        'https://images.unsplash.com/photo-1588776814546-3f8b6f8a5c11?fit=crop&w=800&q=80',
    },
    {
      title: 'Nutrition After 60',
      description: 'Eating well is more important than ever.',
      content:
        'As we age, our bodies require fewer calories but more nutrients. Focus on whole foods like fruits, vegetables, lean protein, and drink plenty of water...',
      image:
        'https://images.unsplash.com/photo-1604908812246-df7a1a3ec86c?fit=crop&w=800&q=80',
    },
    {
      title: 'Social Connection Matters',
      description: 'How friends and family can boost health.',
      content:
        'Loneliness can impact both mental and physical health. Make time to call a friend, join a group, or invite someone for a walk...',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=800&q=80',
    },
  ]);

  return (
    <View style={styles.container}>
      <NavHeader
        title="Senior News"
        subtitle="Latest Tips & Articles"
        onHelpPress={() => {}}
      />

      <FlatList
        data={articles}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/newsDetail',
                params: item,
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#f0f4f8',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    height: 160,
    width: '100%',
  },
  textContainer: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
});



