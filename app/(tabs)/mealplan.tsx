import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_OPTIONS = [3, 5, 7, 10, 14];

export default function MealPlanScreen() {
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  const generateMealPlan = async (items: string, days: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyABCyWxPFf-JICQYcLABOaV0eZnnIn9cpU',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Based on these food items from my receipt: ${items}, create a ${days}-day meal plan. 
                    Include breakfast, lunch, and dinner for each day.
                    Include the cost for each day, average cost per meal, and total cost for the week.
                    Make sure to use the ingredients I have and prioritize for affordability.
                    Format the response as a clear, organized list with days and meals.
                    Do not include any additional text or comments.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      const outputText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No meal plan generated.';
      setMealPlan(outputText);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      setMealPlan('Error generating meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAndGenerateMealPlan = async (days: number) => {
    try {
      const result = await AsyncStorage.getItem('lastGeminiResult');
      if (result) {
        await generateMealPlan(result, days);
      } else {
        setMealPlan('No receipt items found. Please scan a receipt first.');
      }
    } catch (error) {
      console.error('Error loading receipt data:', error);
      setMealPlan('Error loading receipt data. Please try again.');
    }
  };

  const handleDaySelection = (days: number) => {
    setSelectedDays(days);
    loadAndGenerateMealPlan(days);
  };

  const resetSelection = () => {
    setSelectedDays(null);
    setMealPlan(null);
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        <Text style={styles.title}>Your Meal Plan</Text>

        {!selectedDays ? (
          <View style={styles.daySelectionContainer}>
            <Text style={styles.daySelectionTitle}>How many days would you like to plan for?</Text>
            <View style={styles.dayOptionsContainer}>
              {DAY_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={styles.dayOption}
                  onPress={() => handleDaySelection(days)}
                >
                  <Text style={styles.dayOptionText}>{days} Days</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : loading ? (
          <Text style={styles.loadingText}>
            Generating your {selectedDays}-day meal plan...
          </Text>
        ) : mealPlan ? (
          <View style={styles.mealPlanContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
              <Text style={styles.resetButtonText}>Choose Different Days</Text>
            </TouchableOpacity>
            <ScrollView style={styles.scrollView}>
              <Text style={styles.mealPlanText}>{mealPlan}</Text>
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.noPlanText}>
            No meal plan available. Please scan a receipt first.
          </Text>
        )}
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
    marginBottom: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#4A2B2B',
    textAlign: 'center',
  },
  daySelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelectionTitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#4A2B2B',
  },
  dayOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  dayOption: {
    backgroundColor: '#E36C67',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  dayOptionText: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FFFDF9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#4A2B2B',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#4A2B2B',
  },
  mealPlanText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A2B2B',
  },
  noPlanText: {
    fontSize: 16,
    color: '#998D88',
    textAlign: 'center',
    marginTop: 20,
  },
  mealPlanContainer: {
    flex: 1,
  },
});
