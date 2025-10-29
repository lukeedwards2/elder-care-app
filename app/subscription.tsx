import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import NavHeader from '../components/NavHeader';
import * as InAppPurchases from 'expo-in-app-purchases';

const productIds = Platform.select({
  ios: ['premium_monthly', 'premium_yearly'], // must match App Store Connect IDs
  android: [],
});

export default function SubscriptionPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectAndFetch = async () => {
      try {
        const { responseCode, results } = await InAppPurchases.connectAsync();
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          const items = await InAppPurchases.getProductsAsync(productIds);
          setProducts(items);
        }
      } catch (error) {
        console.log('IAP init error:', error);
        Alert.alert('Error', 'Unable to connect to App Store. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    connectAndFetch();

    // Listen for purchase updates
    const subscription = InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results.forEach((purchase) => {
          if (!purchase.acknowledged) {
            InAppPurchases.finishTransactionAsync(purchase, true);
            Alert.alert('Success', 'Your subscription is now active!');
          }
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        Alert.alert('Cancelled', 'Purchase cancelled.');
      } else {
        Alert.alert('Error', 'There was an issue completing your purchase.');
      }
    });

    return () => {
      subscription.remove();
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const handleSubscribe = async (productId) => {
    try {
      await InAppPurchases.requestPurchaseAsync(productId);
    } catch (error) {
      console.log('Purchase error:', error);
      Alert.alert('Error', 'Unable to start purchase process.');
    }
  };

  const handleRestore = async () => {
    try {
      const { responseCode, results } = await InAppPurchases.restorePurchasesAsync();
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results.length > 0) {
        Alert.alert('Restored', 'Your previous purchase has been restored.');
      } else {
        Alert.alert('No Purchases', 'No previous subscriptions found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases.');
    }
  };

  return (
    <View style={styles.container}>
      <NavHeader title="Subscription" helpText="Subscribe to unlock premium features." />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.description}>
          Subscribing gives you access to extra features to make caregiving easier and more efficient.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 40 }} />
        ) : (
          <>
            {products.map((product) => (
              <View key={product.productId} style={styles.optionBox}>
                <Text style={styles.priceTitle}>
                  {product.productId.includes('monthly')
                    ? '$4.95 / month'
                    : '$48 / year'}
                </Text>
                <Text style={styles.trial}>7-day free trial</Text>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => handleSubscribe(product.productId)}
                >
                  <Text style={styles.subscribeText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity onPress={handleRestore} style={styles.restoreLink}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionBox: {
    width: '100%',
    alignItems: 'center',
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 20,
    marginBottom: 20,
  },
  priceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 6,
  },
  trial: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreLink: {
    marginTop: 10,
  },
  restoreText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});




