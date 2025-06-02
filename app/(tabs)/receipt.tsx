import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
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

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      const result = await AsyncStorage.getItem('lastGeminiResult');
      if (result) {
        const items = result
          .split('\n')
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
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        <Text style={styles.title}>Receipt Details</Text>

        {loading ? (
          <Text style={styles.message}>Loading receipt data...</Text>
        ) : receiptItems.length > 0 ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {receiptItems.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            ))}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.message}>No receipt items found. Scan a receipt to get started.</Text>
        )}
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.mealPlanButton} onPress={() => router.push('/mealplan')}>
          <Text style={styles.mealPlanButtonText}>View Meal Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FDEAD8',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A2B2B',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#998D88',
    textAlign: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#4A2B2B',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A2B2B',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A2B2B',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A2B2B',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#FDEAD8',
  },
  mealPlanButton: {
    backgroundColor: '#E36C67',
    padding: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  mealPlanButtonText: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
