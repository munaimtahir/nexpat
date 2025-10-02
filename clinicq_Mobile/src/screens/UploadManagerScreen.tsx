import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, ProgressBar, TextInput } from 'react-native-paper';
import { useUploadPrescription } from '@/api/hooks/useUploads';

export const UploadManagerScreen: React.FC = () => {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const uploadMutation = useUploadPrescription();

  const selectImage = async (source: 'camera' | 'library') => {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (!result.canceled) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg');
    }
  };

  const onUpload = async () => {
    if (!fileUri) {
      Alert.alert('Select a file first');
      return;
    }
    if (!patientId || !visitId) {
      Alert.alert('Patient and visit are required');
      return;
    }

    setProgress(0);
    try {
      const response = await uploadMutation.mutateAsync({
        fileUri,
        fileName,
        patient: Number(patientId),
        visit: Number(visitId),
        description,
        onUploadProgress: setProgress
      });
      if ((response as any)?.status === 202) {
        Alert.alert('Upload queued', 'We will retry automatically once online.');
      } else {
        Alert.alert('Upload complete');
      }
      setFileUri(null);
      setDescription('');
      setPatientId('');
      setVisitId('');
      setProgress(0);
    } catch (error) {
      Alert.alert('Upload failed', 'The upload will retry when connectivity is restored.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>Prescription uploads</Text>
      <Button mode="outlined" onPress={() => selectImage('camera')} style={{ marginBottom: 12 }}>
        Capture photo
      </Button>
      <Button mode="outlined" onPress={() => selectImage('library')} style={{ marginBottom: 12 }}>
        Choose from library
      </Button>

      {fileUri ? <Text style={{ marginBottom: 12 }}>Selected: {fileName}</Text> : null}

      <TextInput label="Patient ID" value={patientId} onChangeText={setPatientId} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Visit ID" value={visitId} onChangeText={setVisitId} keyboardType="numeric" style={{ marginBottom: 12 }} />
      <TextInput label="Description" value={description} onChangeText={setDescription} multiline style={{ marginBottom: 12 }} />

      {uploadMutation.isPending ? <ProgressBar progress={progress / 100} style={{ marginBottom: 12 }} /> : null}

      <Button mode="contained" onPress={onUpload} loading={uploadMutation.isPending}>
        Upload
      </Button>
    </View>
  );
};
