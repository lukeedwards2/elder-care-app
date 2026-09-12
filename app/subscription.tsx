// app/subscription.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';

import {
  ProductSubscription,
  Purchase,
  useIAP,
} from 'expo-iap';

import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

const PRODUCT_IDS = [
  'premium_yearly',
  'premium_monthly',
];

const PRIVACY_POLICY_URL =
  'https://seriouslyseniors.com/elementor-9245/';

const TERMS_OF_USE_URL =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export default function SubscriptionPage() {
  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [purchaseInFlight, setPurchaseInFlight] =
    useState<string | null>(null);

  const [storeMessage, setStoreMessage] =
    useState('');

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (
      purchase: Purchase
    ) => {
      try {
        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        setPurchaseInFlight(null);

        Alert.alert(
          'Subscription Successful',
          'Your CareKeeperHub Premium subscription is now active.'
        );
      } catch (error) {
        console.log(
          'finishTransaction error:',
          error
        );

        setPurchaseInFlight(null);

        Alert.alert(
          'Purchase Completed',
          'Your purchase was completed, but we had trouble finalizing it. Please reopen the app or use Restore Purchases.'
        );
      }
    },

    onPurchaseError: (error) => {
      console.log(
        'Purchase error:',
        error
      );

      setPurchaseInFlight(null);

      const errorCode =
        String(
          error?.code ?? ''
        ).toLowerCase();

      if (
        errorCode.includes('cancel') ||
        errorCode.includes(
          'user-cancelled'
        ) ||
        errorCode.includes(
          'user-canceled'
        )
      ) {
        return;
      }

      Alert.alert(
        'Purchase Unavailable',
        'We could not complete the purchase right now. Please try again.'
      );
    },

    onError: (error: Error) => {
      console.log(
        'IAP error:',
        error
      );
    },
  });

  useEffect(() => {
    if (
      Platform.OS !== 'ios'
    ) {
      setLoadingProducts(
        false
      );

      setStoreMessage(
        'Subscriptions are currently available on iOS only.'
      );

      return;
    }

    if (!connected) {
      return;
    }

    let active = true;

    const loadSubscriptions =
      async () => {
        try {
          setLoadingProducts(
            true
          );

          setStoreMessage('');

          await fetchProducts({
            skus: PRODUCT_IDS,
            type: 'subs',
          });
        } catch (error) {
          console.log(
            'Failed to fetch subscription products:',
            error
          );

          if (active) {
            setStoreMessage(
              'Subscriptions are temporarily unavailable. Please try again shortly.'
            );
          }
        } finally {
          if (active) {
            setLoadingProducts(
              false
            );
          }
        }
      };

    loadSubscriptions();

    return () => {
      active = false;
    };
  }, [
    connected,
    fetchProducts,
  ]);

  useEffect(() => {
    if (!connected) {
      return;
    }

    if (
      subscriptions.length > 0
    ) {
      setLoadingProducts(
        false
      );

      setStoreMessage('');
    }
  }, [
    connected,
    subscriptions,
  ]);

  const sortedSubscriptions =
    useMemo(() => {
      const yearly =
        subscriptions.find(
          (product) =>
            product.id ===
            'premium_yearly'
        );

      const monthly =
        subscriptions.find(
          (product) =>
            product.id ===
            'premium_monthly'
        );

      return [
        yearly,
        monthly,
      ].filter(
        Boolean
      ) as ProductSubscription[];
    }, [subscriptions]);

  const getPlanName = (
    product: ProductSubscription
  ) => {
    if (
      product.id ===
      'premium_monthly'
    ) {
      return 'CareKeeperHub Monthly';
    }

    if (
      product.id ===
      'premium_yearly'
    ) {
      return 'CareKeeperHub Yearly';
    }

    return (
      product.title ||
      'CareKeeperHub Premium'
    );
  };

  const getPlanSubtitle = (
    product: ProductSubscription
  ) => {
    if (
      product.id ===
      'premium_monthly'
    ) {
      return '1-month auto-renewing subscription';
    }

    if (
      product.id ===
      'premium_yearly'
    ) {
      return '1-year auto-renewing subscription';
    }

    return 'Auto-renewing Premium subscription';
  };

  const getRenewalPeriod = (
    product: ProductSubscription
  ) => {
    if (
      product.id ===
      'premium_monthly'
    ) {
      return '/month';
    }

    if (
      product.id ===
      'premium_yearly'
    ) {
      return '/year';
    }

    return '';
  };

  const getTrialDisclosure = (
    product: ProductSubscription
  ) => {
    if (
      Platform.OS !== 'ios'
    ) {
      return null;
    }

    if (
      !(
        'subscriptionInfoIOS' in
        product
      )
    ) {
      return null;
    }

    const iosSubscriptionInfo =
      (product as any)
        .subscriptionInfoIOS;

    const introOffer =
      iosSubscriptionInfo
        ?.introductoryOffer;

    if (!introOffer) {
      return null;
    }

    if (
      introOffer.paymentMode !==
      'free-trial'
    ) {
      return null;
    }

    const rawUnit =
      String(
        introOffer.period?.unit ||
          ''
      ).toLowerCase();

    const periodCount =
      Number(
        introOffer.periodCount
      ) || 1;

    let readableUnit =
      rawUnit;

    if (
      rawUnit === 'day'
    ) {
      readableUnit =
        periodCount === 1
          ? 'day'
          : 'days';
    } else if (
      rawUnit === 'week'
    ) {
      readableUnit =
        periodCount === 1
          ? 'week'
          : 'weeks';
    } else if (
      rawUnit === 'month'
    ) {
      readableUnit =
        periodCount === 1
          ? 'month'
          : 'months';
    } else if (
      rawUnit === 'year'
    ) {
      readableUnit =
        periodCount === 1
          ? 'year'
          : 'years';
    }

    const trialLength =
      readableUnit
        ? `${periodCount} ${readableUnit}`
        : 'Free trial';

    return `${trialLength} free for eligible new subscribers, then ${product.displayPrice}${getRenewalPeriod(
      product
    )}.`;
  };

  const openLegalLink =
    async (
      url: string,
      label: string
    ) => {
      try {
        const supported =
          await Linking.canOpenURL(
            url
          );

        if (!supported) {
          Alert.alert(
            `${label} Unavailable`,
            `We could not open the ${label.toLowerCase()} right now.`
          );

          return;
        }

        await Linking.openURL(
          url
        );
      } catch (error) {
        console.log(
          `Failed to open ${label}:`,
          error
        );

        Alert.alert(
          `${label} Unavailable`,
          `We could not open the ${label.toLowerCase()} right now.`
        );
      }
    };

  const handleSubscribe =
    async (
      productId: string
    ) => {
      if (
        Platform.OS !== 'ios'
      ) {
        Alert.alert(
          'Not Supported',
          'Subscriptions are currently available on iOS only.'
        );

        return;
      }

      if (!connected) {
        Alert.alert(
          'Please Wait',
          'The App Store is still connecting. Please try again in a moment.'
        );

        return;
      }

      const product =
        subscriptions.find(
          (subscription) =>
            subscription.id ===
            productId
        );

      if (!product) {
        Alert.alert(
          'Subscription Unavailable',
          'This subscription could not be loaded from the App Store. Please try again shortly.'
        );

        return;
      }

      try {
        setPurchaseInFlight(
          productId
        );

        await requestPurchase({
          request: {
            apple: {
              sku: productId,
            },

            google: {
              skus: [
                productId,
              ],
            },
          },

          type: 'subs',
        });
      } catch (error) {
        console.log(
          'requestPurchase error:',
          error
        );

        setPurchaseInFlight(
          null
        );

        Alert.alert(
          'Purchase Error',
          'Unable to open the App Store purchase screen. Please try again.'
        );
      }
    };

  const handleRestore =
    async () => {
      if (
        Platform.OS !== 'ios'
      ) {
        Alert.alert(
          'Not Supported',
          'Restore Purchases is currently available on iOS only.'
        );

        return;
      }

      if (!connected) {
        Alert.alert(
          'Please Wait',
          'The App Store is still connecting. Please try again in a moment.'
        );

        return;
      }

      try {
        const restored =
          await restorePurchases();

        if (
          Array.isArray(
            restored
          ) &&
          restored.length > 0
        ) {
          Alert.alert(
            'Purchases Restored',
            'Your eligible previous purchases have been restored.'
          );
        } else {
          Alert.alert(
            'Restore Complete',
            'No previous eligible purchases were found for this Apple ID.'
          );
        }
      } catch (error) {
        console.log(
          'Restore purchases error:',
          error
        );

        Alert.alert(
          'Restore Failed',
          'We could not restore purchases right now. Please try again.'
        );
      }
    };

  const renderSubscriptionCard =
    (
      product: ProductSubscription,
      recommended = false
    ) => {
      const isPurchasing =
        purchaseInFlight ===
        product.id;

      const trialDisclosure =
        getTrialDisclosure(
          product
        );

      return (
        <View
          key={product.id}
          style={[
            styles.planCard,
            recommended &&
              styles.recommendedPlanCard,
          ]}
        >
          {recommended && (
            <View
              style={
                styles.recommendedBadge
              }
            >
              <Text
                style={
                  styles.recommendedBadgeText
                }
              >
                BEST VALUE
              </Text>
            </View>
          )}

          <View
            style={
              styles.planHeader
            }
          >
            <View
              style={
                styles.planIcon
              }
            >
              <Ionicons
                name={
                  product.id ===
                  'premium_yearly'
                    ? 'star-outline'
                    : 'calendar-outline'
                }
                size={26}
                color="#1976D2"
              />
            </View>

            <View
              style={
                styles.planHeaderText
              }
            >
              <Text
                style={
                  styles.planName
                }
              >
                {getPlanName(
                  product
                )}
              </Text>

              <Text
                style={
                  styles.planSubtitle
                }
              >
                {getPlanSubtitle(
                  product
                )}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.priceRow
            }
          >
            <Text
              style={
                styles.price
              }
            >
              {
                product.displayPrice
              }
            </Text>

            <Text
              style={
                styles.pricePeriod
              }
            >
              {product.id ===
              'premium_monthly'
                ? '/ month'
                : '/ year'}
            </Text>
          </View>

          {trialDisclosure && (
            <View
              style={
                styles.trialBox
              }
            >
              <View
                style={
                  styles.trialIcon
                }
              >
                <Ionicons
                  name="gift-outline"
                  size={21}
                  color="#1976D2"
                />
              </View>

              <View
                style={
                  styles.trialTextWrap
                }
              >
                <Text
                  style={
                    styles.trialTitle
                  }
                >
                  Introductory offer
                </Text>

                <Text
                  style={
                    styles.trialText
                  }
                >
                  {
                    trialDisclosure
                  }
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.subscribeButton,

              purchaseInFlight !==
                null &&
                styles.subscribeButtonDisabled,
            ]}
            onPress={() =>
              handleSubscribe(
                product.id
              )
            }
            disabled={
              purchaseInFlight !==
              null
            }
            activeOpacity={
              0.85
            }
          >
            {isPurchasing ? (
              <ActivityIndicator
                color="#fff"
              />
            ) : (
              <>
                <Text
                  style={
                    styles.subscribeButtonText
                  }
                >
                  Choose{' '}
                  {getPlanName(
                    product
                  )}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <NavHeader />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.heroIcon
          }
        >
          <Ionicons
            name="diamond-outline"
            size={42}
            color="#1976D2"
          />
        </View>

        <Text
          style={
            styles.title
          }
        >
          CareKeeperHub Premium
        </Text>

        <Text
          style={
            styles.description
          }
        >
          Unlock premium
          caregiving features and
          keep everything your care
          team needs organized in
          one place.
        </Text>

        <View
          style={
            styles.featureCard
          }
        >
          <View
            style={
              styles.featureRow
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#1976D2"
            />

            <Text
              style={
                styles.featureText
              }
            >
              Premium caregiving
              tools
            </Text>
          </View>

          <View
            style={
              styles.featureRow
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#1976D2"
            />

            <Text
              style={
                styles.featureText
              }
            >
              Access across your
              caregiving experience
            </Text>
          </View>

          <View
            style={
              styles.featureRow
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#1976D2"
            />

            <Text
              style={
                styles.featureText
              }
            >
              Simple Apple
              subscription management
            </Text>
          </View>
        </View>

        {!connected ||
        loadingProducts ? (
          <View
            style={
              styles.loadingBox
            }
          >
            <ActivityIndicator
              size="large"
              color="#1976D2"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading App Store
              subscriptions…
            </Text>
          </View>
        ) : sortedSubscriptions
            .length > 0 ? (
          <View
            style={
              styles.plansContainer
            }
          >
            {sortedSubscriptions.map(
              (product) =>
                renderSubscriptionCard(
                  product,
                  product.id ===
                    'premium_yearly'
                )
            )}
          </View>
        ) : (
          <View
            style={
              styles.unavailableCard
            }
          >
            <Ionicons
              name="cloud-offline-outline"
              size={34}
              color="#7A8797"
            />

            <Text
              style={
                styles.unavailableTitle
              }
            >
              Subscriptions
              unavailable
            </Text>

            <Text
              style={
                styles.unavailableText
              }
            >
              {storeMessage ||
                'The App Store did not return the subscription products. Please try again shortly.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={
            styles.restoreButton
          }
          onPress={
            handleRestore
          }
          disabled={
            !connected ||
            purchaseInFlight !==
              null
          }
          activeOpacity={
            0.8
          }
        >
          <Ionicons
            name="refresh-outline"
            size={19}
            color="#1976D2"
          />

          <Text
            style={
              styles.restoreText
            }
          >
            Restore Purchases
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.appleNote
          }
        >
          Payment will be charged
          to your Apple ID account
          at confirmation of
          purchase. Your
          subscription automatically
          renews unless it is
          canceled at least 24 hours
          before the end of the
          current subscription
          period. Your account will
          be charged for renewal
          within 24 hours prior to
          the end of the current
          period. You can manage or
          cancel your subscription
          in your Apple ID
          subscription settings.
        </Text>

        <View
          style={
            styles.legalLinksContainer
          }
        >
          <TouchableOpacity
            onPress={() =>
              openLegalLink(
                PRIVACY_POLICY_URL,
                'Privacy Policy'
              )
            }
            activeOpacity={
              0.7
            }
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
          >
            <Text
              style={
                styles.legalLink
              }
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.legalSeparator
            }
          >
            •
          </Text>

          <TouchableOpacity
            onPress={() =>
              openLegalLink(
                TERMS_OF_USE_URL,
                'Terms of Use'
              )
            }
            activeOpacity={
              0.7
            }
            accessibilityRole="link"
            accessibilityLabel="Open Terms of Use"
          >
            <Text
              style={
                styles.legalLink
              }
            >
              Terms of Use (EULA)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F6F9FD',
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 28,
      paddingBottom: 120,
    },

    heroIcon: {
      width: 86,
      height: 86,
      borderRadius: 28,
      backgroundColor:
        '#E8F2FE',
      alignItems: 'center',
      justifyContent:
        'center',
      alignSelf: 'center',
      marginBottom: 18,
    },

    title: {
      fontSize: 31,
      lineHeight: 38,
      fontWeight: '800',
      color: '#172131',
      textAlign: 'center',
    },

    description: {
      marginTop: 10,
      fontSize: 17,
      lineHeight: 25,
      color: '#7A8797',
      textAlign: 'center',
      paddingHorizontal: 10,
    },

    featureCard: {
      backgroundColor:
        '#fff',
      borderWidth: 1,
      borderColor:
        '#DDE5EF',
      borderRadius: 24,
      padding: 20,
      marginTop: 26,
      marginBottom: 22,
    },

    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 6,
    },

    featureText: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      lineHeight: 22,
      color: '#34445A',
      fontWeight: '600',
    },

    loadingBox: {
      backgroundColor:
        '#fff',
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        '#DDE5EF',
      minHeight: 180,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 24,
    },

    loadingText: {
      marginTop: 14,
      fontSize: 15,
      color: '#7A8797',
      textAlign: 'center',
    },

    plansContainer: {
      width: '100%',
    },

    planCard: {
      backgroundColor:
        '#fff',
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        '#DDE5EF',
      padding: 20,
      marginBottom: 18,
      overflow: 'hidden',
    },

    recommendedPlanCard: {
      borderWidth: 2,
      borderColor:
        '#1976D2',
    },

    recommendedBadge: {
      alignSelf:
        'flex-start',
      backgroundColor:
        '#E8F2FE',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      marginBottom: 16,
    },

    recommendedBadgeText: {
      color: '#1976D2',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.6,
    },

    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    planIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor:
        '#E8F2FE',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    planHeaderText: {
      flex: 1,
    },

    planName: {
      fontSize: 22,
      fontWeight: '800',
      color: '#172131',
    },

    planSubtitle: {
      marginTop: 3,
      fontSize: 14,
      lineHeight: 20,
      color: '#7A8797',
    },

    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: 20,
    },

    price: {
      fontSize: 32,
      fontWeight: '800',
      color: '#172131',
    },

    pricePeriod: {
      fontSize: 15,
      color: '#7A8797',
      marginLeft: 6,
      marginBottom: 5,
    },

    trialBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        '#F2F8FF',
      borderWidth: 1,
      borderColor:
        '#D8EAFE',
      borderRadius: 16,
      padding: 13,
      marginTop: 15,
    },

    trialIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 11,
    },

    trialTextWrap: {
      flex: 1,
    },

    trialTitle: {
      fontSize: 13,
      color: '#1976D2',
      fontWeight: '800',
      marginBottom: 2,
    },

    trialText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#4B5B6E',
      fontWeight: '600',
    },

    subscribeButton: {
      marginTop: 22,
      minHeight: 56,
      backgroundColor:
        '#1976D2',
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    subscribeButtonDisabled: {
      opacity: 0.55,
    },

    subscribeButtonText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '800',
    },

    unavailableCard: {
      backgroundColor:
        '#fff',
      borderWidth: 1,
      borderColor:
        '#DDE5EF',
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
    },

    unavailableTitle: {
      marginTop: 12,
      fontSize: 19,
      fontWeight: '800',
      color: '#172131',
    },

    unavailableText: {
      marginTop: 8,
      color: '#7A8797',
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
    },

    restoreButton: {
      minHeight: 54,
      marginTop: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#D8E3EF',
      backgroundColor:
        '#fff',
      alignItems: 'center',
      justifyContent:
        'center',
      flexDirection: 'row',
      gap: 7,
    },

    restoreText: {
      color: '#1976D2',
      fontSize: 16,
      fontWeight: '700',
    },

    appleNote: {
      marginTop: 20,
      paddingHorizontal: 8,
      fontSize: 12,
      lineHeight: 18,
      color: '#8793A2',
      textAlign: 'center',
    },

    legalLinksContainer: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      flexWrap: 'wrap',
      paddingHorizontal: 10,
    },

    legalLink: {
      fontSize: 13,
      lineHeight: 20,
      color: '#1976D2',
      fontWeight: '700',
      textDecorationLine:
        'underline',
    },

    legalSeparator: {
      marginHorizontal: 9,
      fontSize: 13,
      color: '#A0AAB7',
    },
  });





