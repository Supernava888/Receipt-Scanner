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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ReceiptItem {
  name: string;
  price: string;
  quantity: number;
}

export default function ReceiptScreen() {
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [originalItems, setOriginalItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadReceiptData = async () => {
    try {
      setLoading(true);
      // Load original data from Gemini
      const originalResult = await AsyncStorage.getItem('lastGeminiResult');
      // Load modified data if it exists
      const modifiedResult = await AsyncStorage.getItem('modifiedReceiptData');
      
      if (originalResult) {
        const items = originalResult
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [name, price] = line.split(',').map(s => s.trim());
            return { name, price, quantity: 1 };
          });
        setOriginalItems(items);
        
        // If there's modified data, use that instead
        if (modifiedResult) {
          const modifiedItems = JSON.parse(modifiedResult);
          setReceiptItems(modifiedItems);
          setIsModified(true);
        } else {
          setReceiptItems(items);
          setIsModified(false);
        }
      } else {
        setReceiptItems([]);
        setOriginalItems([]);
        setIsModified(false);
      }
    } catch (error) {
      console.error('Error loading receipt data:', error);
      setReceiptItems([]);
      setOriginalItems([]);
      setIsModified(false);
    } finally {
      setLoading(false);
    }
  };

  const saveReceiptData = async () => {
    try {
      // Save modified data separately
      await AsyncStorage.setItem('modifiedReceiptData', JSON.stringify(receiptItems));
      setIsModified(true);
    } catch (error) {
      console.error('Error saving receipt data:', error);
    }
  };

  const resetToOriginal = async () => {
    setReceiptItems(originalItems);
    await AsyncStorage.removeItem('modifiedReceiptData');
    setIsModified(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadReceiptData();
    }, [])
  );

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...receiptItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setReceiptItems(newItems);
    saveReceiptData();
  };

  const updateQuantity = (index: number, change: number) => {
    const newItems = [...receiptItems];
    const newQuantity = Math.max(1, newItems[index].quantity + change);
    newItems[index] = { ...newItems[index], quantity: newQuantity };
    setReceiptItems(newItems);
    saveReceiptData();
  };

  const calculateTotal = () => {
    return receiptItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      return sum + (isNaN(price) ? 0 : price) * item.quantity;
    }, 0);
  };

  const deleteItem = async (index: number) => {
    const newItems = [...receiptItems];
    newItems.splice(index, 1);
    setReceiptItems(newItems);
    saveReceiptData();
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Receipt Details</Text>
          {isModified && (
            <TouchableOpacity style={styles.resetButton} onPress={resetToOriginal}>
              <Text style={styles.resetButtonText}>Reset to Original</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={styles.message}>Loading receipt data...</Text>
        ) : receiptItems.length > 0 ? (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {receiptItems.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <View style={styles.itemLeftSection}>
                  <TextInput
                    style={styles.itemNameInput}
                    value={item.name}
                    onChangeText={(text) => updateItem(index, 'name', text)}
                    placeholder="Item name"
                  />
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, -1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(index, 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.itemRightSection}>
                  <TextInput
                    style={styles.itemPriceInput}
                    value={item.price}
                    onChangeText={(text) => updateItem(index, 'price', text)}
                    placeholder="Price"
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteItem(index)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
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
        <TouchableOpacity 
          style={styles.mealPlanButton} 
          onPress={() => {
            // Pass the current items to the meal plan screen
            router.push({
              pathname: '/mealplan',
              params: { items: JSON.stringify(receiptItems) }
            });
          }}
        >
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A2B2B',
  },
  resetButton: {
    backgroundColor: '#4A2B2B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  resetButtonText: {
    color: '#FFFDF9',
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
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
  itemLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemNameInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A2B2B',
    padding: 0,
  },
  itemRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPriceInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A2B2B',
    textAlign: 'right',
    minWidth: 80,
    padding: 0,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEAD8',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E36C67',
    borderRadius: 12,
  },
  quantityButtonText: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    color: '#4A2B2B',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
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
  deleteButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E36C67',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFDF9',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});
