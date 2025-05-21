import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Receipt Scanner</ThemedText>
        <ThemedText style={styles.subtitle}>Your Digital Receipt Manager</ThemedText>
      </ThemedView>

      <Link href="/(tabs)/scan" asChild>
        <Pressable style={({ pressed }) => [
          styles.scanButton,
          pressed && styles.scanButtonPressed
        ]}>
          <ThemedText style={styles.scanButtonText}>Scan Receipt</ThemedText>
        </Pressable>
      </Link>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <ThemedView style={styles.actionContainer}>
          <ThemedText>• Scan a new receipt</ThemedText>
          <ThemedText>• View recent scans</ThemedText>
          <ThemedText>• Check your statistics</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Recent Activity</ThemedText>
        <ThemedView style={styles.activityContainer}>
          <ThemedText>Your recent scans will appear here</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Getting Started</ThemedText>
        <ThemedText style={styles.description}>
          Use the camera button to scan your first receipt. We'll help you organize and track your expenses automatically.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 16,
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionContainer: {
    gap: 8,
  },
  activityContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  description: {
    lineHeight: 20,
  },
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
