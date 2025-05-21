import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScanScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView | null>(null);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
  
    if (!permission) {
      // Camera permissions are still loading.
      return <View />;
    }
  
    if (!permission.granted) {
      // Camera permissions are not granted yet.
      return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
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
          quality: 0.2, // Lower quality to reduce size
          base64: true,
        });
        setPhotoData(pic.base64 || null);
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
                      { text: "Analyze the following image and extract the food items and prices from the receipt. Return only food items and prices in plain text (fooditem, price). Do not include any other text or comments such as a header." },
                      {
                        inlineData: {
                          mimeType: "image/jpeg",
                          data: pic.base64,
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
          // Save to AsyncStorage
          await AsyncStorage.setItem('lastGeminiResult', outputText);
          // Navigate to receipt page
          router.push('/receipt');
        } catch (e) {
          console.error("Error analyzing image:", e);
        } finally {
          setLoading(false);
        }
      }
    }
  
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.leftButton]} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.rightButton]} onPress={takePicture} disabled={loading}>
              <Text style={styles.text}>{loading ? 'Processing...' : 'Take Photo'}</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    message: {
      textAlign: 'center',
      paddingBottom: 10,
    },
    camera: {
      flex: 1,
    },
    buttonRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 100,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 32,
      backgroundColor: 'transparent',
    },
    button: {
      alignItems: 'center',
    },
    leftButton: {
      alignSelf: 'flex-end',
    },
    rightButton: {
      alignSelf: 'flex-end',
    },
    text: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
  });