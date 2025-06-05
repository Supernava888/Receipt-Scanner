import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset photoData when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setPhotoData(null);
    }, [])
  );

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      setLoading(true);
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
      });
      setPhotoData(pic.base64 || null);
      setLoading(false);
    }
  }

  async function processImage() {
    if (!photoData) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyABCyWxPFf-JICQYcLABOaV0eZnnIn9cpU",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Analyze the following receipt image. For each line that contains a food item and a price, extract the full food item name and its price. Only include lines where a price (e.g., $X.XX) appears at the end of the line. Return the result as: fooditem, price (one per line). Do not include any other text or comments."
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: photoData,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No result found.";

      // Clear any previous modified data when processing a new receipt
      await AsyncStorage.removeItem('modifiedReceiptData');
      await AsyncStorage.setItem('lastGeminiResult', outputText);

      // Parse items for recent receipts
      const items = outputText
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const lastComma = line.lastIndexOf(',');
          if (lastComma === -1) return null;
          const name = line.slice(0, lastComma).trim();
          const price = line.slice(lastComma + 1).trim();
          return { name, price, quantity: 1 };
        })
        .filter((item: { name: string; price: string; quantity: number } | null): item is { name: string; price: string; quantity: number } => item !== null);
      const total = items.reduce((sum: number, item: { name: string; price: string; quantity: number }) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
        return sum + (isNaN(price) ? 0 : price) * (item.quantity || 1);
      }, 0);
      const newReceipt = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items,
        total,
      };
      let recentReceipts = [];
      try {
        const stored = await AsyncStorage.getItem('recentReceipts');
        if (stored) recentReceipts = JSON.parse(stored);
      } catch {}
      recentReceipts.unshift(newReceipt);
      if (recentReceipts.length > 10) recentReceipts = recentReceipts.slice(0, 10);
      await AsyncStorage.setItem('recentReceipts', JSON.stringify(recentReceipts));

      router.push('/receipt');
    } catch (e) {
      console.error("Error analyzing image:", e);
    } finally {
      setLoading(false);
    }
  }

  function retakePhoto() {
    setPhotoData(null);
  }

  if (photoData) {
    return (
      <View style={styles.mainContainer}>
        <Image 
          source={{ uri: `data:image/jpeg;base64,${photoData}` }} 
          style={styles.previewImage} 
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.retakeButton]} 
            onPress={retakePhoto}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={processImage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Done'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.buttonText}>Flip Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={takePicture}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Take Photo'}</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FDEAD8',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDEAD8',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#4A2B2B',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#E36C67',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  permissionButtonText: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#E36C67',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  retakeButton: {
    backgroundColor: '#4A2B2B',
  },
  disabledButton: {
    backgroundColor: '#D28A89',
  },
  buttonText: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: '600',
  },
});
