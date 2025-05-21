import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet } from 'react-native';

export default function MealPlanScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meal Plan</ThemedText>
      <ThemedText>Your meal plan will appear here</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
}); 