import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReceiptItem {
  name: string;
  price: string;
}

export default function ReceiptScreen() {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      const result = await AsyncStorage.getItem('lastGeminiResult');
      if (result) {
        // Parse the text into items
        const items = result.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [name, price] = line.split(',').map(s => s.trim());
            return { name, price };
          });
        setReceiptItems(items);
      } else {
        setReceiptItems([]);
      }
    } catch (error) {
      console.error('Error loading receipt data:', error);
      setReceiptItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReceiptData();
    }, [])
  );

  const calculateTotal = () => {
    return receiptItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  return (
    <View style={[
      styles.mainContainer,
      {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: Colors[colorScheme ?? 'light'].background,
      }
    ]}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Receipt Details</ThemedText>
        
        {loading ? (
          <ThemedText>Loading receipt data...</ThemedText>
        ) : receiptItems.length > 0 ? (
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 100 } // Add extra padding for the button
            ]}
          >
            {receiptItems.map((item, index) => (
              <ThemedView key={index} style={styles.itemContainer}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemPrice}>{item.price}</ThemedText>
              </ThemedView>
            ))}
            <ThemedView style={styles.totalContainer}>
              <ThemedText style={styles.totalLabel}>Total:</ThemedText>
              <ThemedText style={styles.totalAmount}>${calculateTotal().toFixed(2)}</ThemedText>
            </ThemedView>
          </ScrollView>
        ) : (
          <ThemedText>No receipt items found. Scan a receipt to get started.</ThemedText>
        )}
      </ThemedView>

      <View style={[
        styles.buttonContainer,
        { 
          paddingBottom: insets.bottom,
          backgroundColor: Colors[colorScheme ?? 'light'].background
        }
      ]}>
        <TouchableOpacity 
          style={styles.mealPlanButton}
          onPress={() => router.push('/mealplan')}
        >
          <ThemedText style={styles.mealPlanButtonText}>View Meal Plan</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 65, // Increased from 49 to create more space above tab bar
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  mealPlanButton: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  mealPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 