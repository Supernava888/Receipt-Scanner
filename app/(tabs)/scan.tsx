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
                    text: "Analyze the following image and extract the food items and prices from the receipt. Return only food items and prices in plain text (fooditem, price). Do not include any other text or comments such as a header."
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
