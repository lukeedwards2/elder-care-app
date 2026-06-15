import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// ✅ REAL IAP (required for App Review)
import * as InAppPurchases from 'expo-in-app-purchases';

type IAPProduct = {
  productId: string;
  title?: string;
  description?: string;
  price?: string; // localized price string on iOS
};

const productIds = Platform.select({
  ios: ['premium_monthly', 'premium_yearly'],
  android: [],
  default: [],
}) as string[];

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function SubscriptionPage() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeReady, setStoreReady] = useState(false);
  const [purchaseInFlight, setPurchaseInFlight] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const isConnectedRef = useRef(false);
  const purchaseListenerSubRef = useRef<{ remove: () => void } | null>(null);

  const sortedProducts = useMemo(() => {
    const monthly = products.find((p) => p.productId.includes('monthly'));
    const yearly = products.find((p) => p.productId.includes('yearly'));
    return [monthly, yearly].filter(Boolean) as IAPProduct[];
  }, [products]);

  useEffect(() => {
    let isMounted = true;

    const fetchProductsWithRetry = async () => {
      // StoreKit can return empty in sandbox/review on first attempt.
      // Retry a few times before giving up.
      const attempts = 3;

      for (let i = 0; i < attempts; i++) {
        try {
          const items = await InAppPurchases.getProductsAsync(productIds);
          const results = (items?.results as IAPProduct[]) || [];

          if (results.length > 0) {
            if (!isMounted) return;
            setProducts(results);
            setStatusMessage('');
            return;
          }

          // If empty, wait & retry
          await wait(700);
        } catch (e) {
          // Small wait then retry
          await wait(700);
        }
      }

      if (!isMounted) return;
      setProducts([]);
      setStatusMessage(
        'Subscriptions are temporarily unavailable. Please try again in a moment.'
      );
    };

    const initIAP = async () => {
      try {
        if (Platform.OS !== 'ios') {
          setLoading(false);
          setStoreReady(false);
          setStatusMessage('Subscriptions are currently available on iOS only.');
          return;
        }

        // Set listener early (before user can tap)
        purchaseListenerSubRef.current = InAppPurchases.setPurchaseListener(
          async ({ responseCode, results, errorCode }) => {
            try {
              // Always clear the in-flight UI once we get a callback
              setPurchaseInFlight(null);

              if (responseCode === InAppPurchases.IAPResponseCode.OK) {
                // Finish transactions so Apple doesn’t keep re-sending them
                for (const purchase of results ?? []) {
                  try {
                    await InAppPurchases.finishTransactionAsync(purchase, false);
                  } catch (finishErr) {
                    console.log('finishTransactionAsync error:', finishErr);
                  }
                }

                Alert.alert(
                  'Subscription Successful',
                  'Thanks! Your premium subscription is now active.'
                );
                return;
              }

              if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
                // user dismissed Apple sheet
                return;
              }

              console.log('IAP purchase error:', { responseCode, results, errorCode });

              // Keep this message simple + user-friendly (better for review)
              Alert.alert(
                'Purchase Unavailable',
                'We couldn’t complete the purchase right now. Please try again.'
              );
            } catch (listenerErr) {
              console.log('Purchase listener error:', listenerErr);
              setPurchaseInFlight(null);
              Alert.alert('Error', 'An unexpected error occurred during purchase.');
            }
          }
        );

        const { responseCode } = await InAppPurchases.connectAsync();

        if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
          setLoading(false);
          setStoreReady(false);
          setStatusMessage(
            'Unable to connect to the App Store right now. Please try again.'
          );
          return;
        }

        isConnectedRef.current = true;
        if (!isMounted) return;

        // Now we’re connected — fetch products (with retry)
        await fetchProductsWithRetry();

        // Mark store ready if we at least connected (even if products empty, we’ll show message)
        setStoreReady(true);
      } catch (error) {
        console.log('IAP init error:', error);
        setStoreReady(false);
        setStatusMessage('Unable to load subscriptions. Please try again.');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    initIAP();

    return () => {
      isMounted = false;

      try {
        purchaseListenerSubRef.current?.remove();
      } catch {}

      purchaseListenerSubRef.current = null;

      if (isConnectedRef.current) {
        InAppPurchases.disconnectAsync().catch(() => {});
        isConnectedRef.current = false;
      }
    };
  }, []);

  const handleSubscribe = async (productId: string) => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Supported', 'Subscriptions are currently iOS-only.');
        return;
      }

      // ✅ Prevent “tap too fast” review failures
      if (loading || !storeReady || !isConnectedRef.current) {
        Alert.alert('Please Wait', 'Subscriptions are still loading. Try again in a moment.');
        return;
      }

      // ✅ Only allow purchase if the product is actually loaded
      const productExists = products.some((p) => p.productId === productId);
      if (!productExists) {
        Alert.alert(
          'Unavailable',
          'This subscription is not available right now. Please try again.'
        );
        return;
      }

      setPurchaseInFlight(productId);

      // ✅ This triggers the real Apple subscription sheet (Sandbox in review)
      await InAppPurchases.requestPurchaseAsync(productId);
    } catch (err) {
      console.log('requestPurchaseAsync error:', err);
      setPurchaseInFlight(null);
      Alert.alert('Purchase Error', 'Unable to start purchase. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Not Supported', 'Restore is currently iOS-only.');
        return;
      }

      if (loading || !storeReady || !isConnectedRef.current) {
        Alert.alert('Please Wait', 'Subscriptions are still loading. Try again in a moment.');
        return;
      }

      const { responseCode, results } = await InAppPurchases.restorePurchasesAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results && results.length > 0) {
          Alert.alert('Restored', 'Your purchases have been restored.');
        } else {
          Alert.alert('Nothing to Restore', 'No previous purchases were found.');
        }
        return;
      }

      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } catch (err) {
      console.log('restorePurchasesAsync error:', err);
      Alert.alert('Restore Error', 'Unable to restore purchases. Please try again.');
    }
  };

  const renderPriceTitle = (product: IAPProduct) => {
    const isMonthly = product.productId.includes('monthly');
    const price = product.price || (isMonthly ? '$4.95' : '$48');
    return isMonthly ? `Premium Monthly – ${price}` : `Premium Yearly – ${price}`;
  };

  const isButtonDisabled = (productId: string) =>
    loading ||
    !storeReady ||
    !isConnectedRef.current ||
    purchaseInFlight !== null;

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Premium Subscription"
        helpText="Subscribe to unlock premium features like enhanced caregiving tools and unlimited usage."
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.description}>
          Subscribing gives you access to extra features to make caregiving easier
          and more efficient.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 40 }} />
        ) : (
          <>
            {!!statusMessage && (
              <Text style={styles.statusText}>{statusMessage}</Text>
            )}

            {sortedProducts.length === 0 ? (
              <Text style={styles.infoText}>
                If subscriptions don’t appear, confirm your Product IDs match App Store Connect and
                try again shortly.
              </Text>
            ) : (
              <>
                {sortedProducts.map((product) => {
                  const disabled = isButtonDisabled(product.productId);
                  const isThisPurchasing = purchaseInFlight === product.productId;

                  return (
                    <View key={product.productId} style={styles.optionBox}>
                      <Text style={styles.priceTitle}>{renderPriceTitle(product)}</Text>
                      <Text style={styles.trial}>7-day free trial included</Text>

                      <TouchableOpacity
                        style={[
                          styles.subscribeButton,
                          disabled && styles.subscribeButtonDisabled,
                        ]}
                        onPress={() => handleSubscribe(product.productId)}
                        disabled={disabled}
                      >
                        <Text style={styles.subscribeText}>
                          {isThisPurchasing ? 'Opening App Store…' : 'Subscribe Now'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={handleRestore}
          style={styles.restoreLink}
          disabled={loading || purchaseInFlight !== null}
        >
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
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },

  description: {
    fontSize: 17,
    color: '#444',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: '90%',
  },

  statusText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    maxWidth: '95%',
  },

  infoText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
    maxWidth: '95%',
  },

  optionBox: {
    width: '100%',
    alignItems: 'center',
    borderColor: '#1976D2',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 24,
    marginBottom: 24,
    backgroundColor: '#F9FBFF',
  },

  priceTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  trial: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },

  subscribeButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  subscribeButtonDisabled: {
    opacity: 0.6,
  },

  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  restoreLink: {
    marginTop: 10,
    marginBottom: 40,
  },

  restoreText: {
    color: '#777',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});





