import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import Animated, {
  BounceIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const FOOD_EMOJIS: string[] = [
  '🍓', '🥕', '🍔', '🍇', '🧀', '🍍', '🥬', '🍞', '🍕', '🍊',
  '🥑', '🍩', '🍒', '🧁', '🌮', '🥯', '🍜', '🧃', '🥭', '🍣',
];

type EmojiProps = {
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
};

function FallingEmoji(props: EmojiProps): React.ReactElement {
  const translateY = useSharedValue(-80);

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(1000, { duration: props.duration }),
        -1,
        false
      );
    }, props.delay);
    return () => clearTimeout(timeout);
  }, [props.delay, props.duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: props.left,
    transform: [{ translateY: translateY.value }],
    opacity: props.opacity,
  }));

  return (
    <Animated.Text style={[animatedStyle, { fontSize: props.size, zIndex: -1 }]}>
      {props.emoji}
    </Animated.Text>
  );
}

function FallingEmojiLayer(): React.ReactElement {
  const screenWidth = Dimensions.get('window').width;
  const shuffled = [...FOOD_EMOJIS].sort(() => Math.random() - 0.5);
  const emojis: React.ReactElement[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const emoji = shuffled[i];
    const left = Math.floor(Math.random() * screenWidth);
    const delay = Math.floor(Math.random() * 5000);
    emojis.push(
      <FallingEmoji
        key={emoji + '-' + i}
        emoji={emoji}
        left={left}
        delay={delay}
        duration={14000}
        size={48}
        opacity={0.1}
      />
    );
  }

  return <>{emojis}</>;
}

function HomeScreen(): React.ReactElement {
  const router = useRouter();

  // Recent receipts state
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('recentReceipts').then(data => {
        if (data) setRecentReceipts(JSON.parse(data));
        else setRecentReceipts([]);
      });
    }, [])
  );

  const handleFabPress = (): void => {
    try {
      impactAsync(ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('Haptics not supported');
    }
    router.push('/(tabs)/scan');
  };

  return (
    <View style={styles.container}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <FallingEmojiLayer />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View entering={BounceIn} style={styles.heroIconWrapper}>
            <AntDesign name="shoppingcart" size={48} color="#E36C67" />
          </Animated.View>
          <Text style={styles.title}>Receipt Scanner</Text>
          <View style={styles.nameBubbleWrapper}>
            <Text style={styles.nameBubble}>Welcome 👋</Text>
          </View>
          <Text style={styles.subtitle}>Your cozy space for all things receipts.</Text>
        </View>

        <Animated.View entering={FadeInDown}>
          <BlurView intensity={60} tint="light" style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AntDesign name="staro" size={20} color="#E36C67" />
              <Text style={styles.cardTitleText}>Get Started</Text>
            </View>
            <Link href="/(tabs)/scan" asChild>
              <Pressable style={styles.scanButton}>
                <MaterialCommunityIcons name="camera-outline" size={20} color="#FFFDF9" />
                <Text style={styles.scanButtonText}>Scan your receipt</Text>
              </Pressable>
            </Link>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <BlurView intensity={60} tint="light" style={styles.card}>
            <View style={styles.cardTitleRow}>
              <AntDesign name="save" size={18} color="#E36C67" />
              <Text style={styles.cardTitleText}>Recent Activity</Text>
            </View>
            {recentReceipts.length === 0 ? (
              <Text style={styles.cardMuted}>No receipts yet—but this space will soon be full ✨</Text>
            ) : (
              recentReceipts.map(receipt => (
                <View key={receipt.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, justifyContent: 'space-between' }}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => router.push({ pathname: '/receipt', params: { receiptId: receipt.id } })}
                  >
                    <Text style={{ color: '#4A2B2B', fontWeight: '600' }}>
                      {new Date(receipt.date).toLocaleString()} - ${receipt.total.toFixed(2)}
                    </Text>
                    <Text style={{ color: '#998D88', fontSize: 13 }}>
                      {receipt.items.slice(0, 2).map((i: any) => i.name).join(', ')}{receipt.items.length > 2 ? '...' : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      const filtered = recentReceipts.filter(r => r.id !== receipt.id);
                      setRecentReceipts(filtered);
                      await AsyncStorage.setItem('recentReceipts', JSON.stringify(filtered));
                    }}
                    style={{ marginLeft: 12, padding: 6 }}
                  >
                    <AntDesign name="delete" size={20} color="#E36C67" />
                  </Pressable>
                </View>
              ))
            )}
          </BlurView>
        </Animated.View>
      </ScrollView>

    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDEAD8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A2B2B',
    marginBottom: 4,
  },
  nameBubbleWrapper: {
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 6,
  },
  nameBubble: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A2B2B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7D6C66',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,253,249,0.95)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A2B2B',
    marginLeft: 8,
  },
  cardMuted: {
    fontSize: 14,
    color: '#998D88',
    fontStyle: 'italic',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E36C67',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFDF9',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 36 : 24,
    right: 24,
    backgroundColor: '#E36C67',
    padding: 20,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
});
