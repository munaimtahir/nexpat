import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, IconButton, Modal, Portal, ProgressBar, TextInput, useTheme } from 'react-native-paper';
import { useUploadPrescription, usePrescriptionImages } from '@/api/hooks/useUploads';
import type { PrescriptionImage } from '@/api/generated/types';
import { formatDistanceToNow } from 'date-fns';
import { CachedDataNotice } from '@/components/CachedDataNotice';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export const UploadManagerScreen: React.FC = () => {
  const [selectedAssets, setSelectedAssets] = useState<{ uri: string; name: string }[]>([]);
  const [patientId, setPatientId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [description, setDescription] = useState('');
  const [progressByAsset, setProgressByAsset] = useState<Record<string, number>>({});
  const [visitFilter, setVisitFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [selectedImage, setSelectedImage] = useState<PrescriptionImage | null>(null);
  const uploadMutation = useUploadPrescription();
  const theme = useTheme();

  const filterParams = useMemo(
    () => ({
      visitId: visitFilter ? Number(visitFilter) : undefined,
      patientRegistration: patientFilter.trim() ? patientFilter.trim() : undefined
    }),
    [visitFilter, patientFilter]
  );

  const uploadsQuery = usePrescriptionImages(filterParams);

  const selectImage = async (source: 'camera' | 'library') => {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true, selectionLimit: 10 });

    if (!result.canceled && result.assets?.length) {
      setSelectedAssets((current) => [
        ...current,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg'
        }))
      ]);
    }
  };

  const onUpload = async () => {
    if (selectedAssets.length === 0) {
      Alert.alert('Select a file first');
      return;
    }
    if (!patientId || !visitId) {
      Alert.alert('Patient and visit are required');
      return;
    }

    let queued = 0;
    let completed = 0;
    let failed = 0;

    try {
      for (const asset of selectedAssets) {
        setProgressByAsset((prev) => ({ ...prev, [asset.uri]: 0 }));
        try {
          const response = await uploadMutation.mutateAsync({
            fileUri: asset.uri,
            fileName: asset.name,
            patient: Number(patientId),
            visit: Number(visitId),
            description,
            onUploadProgress: (value) =>
              setProgressByAsset((prev) => ({
                ...prev,
                [asset.uri]: value
              }))
          });
          if ((response as any)?.status === 202) {
            queued += 1;
          } else {
            completed += 1;
          }
        } catch (error) {
          failed += 1;
        }
      }
      Alert.alert(
        'Uploads processed',
        `Completed: ${completed}
Queued: ${queued}
Failed: ${failed}`
      );
      setSelectedAssets([]);
      setDescription('');
      setPatientId('');
      setVisitId('');
      setProgressByAsset({});
      void uploadsQuery.refetch();
    } catch (error) {
      Alert.alert('Upload failed', 'Some uploads could not be processed. They will retry when connectivity is restored.');
    }
  };

  const uploads = uploadsQuery.data?.results ?? [];

  const renderUploadItem = ({ item }: { item: PrescriptionImage }) => (
    <TouchableOpacity onPress={() => setSelectedImage(item)} style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>Visit #{item.visit}</Text>
        <Text style={styles.cardSubtitle}>Uploaded {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
        {item.drive_file_id ? <Text style={styles.cardMeta}>Drive ID: {item.drive_file_id}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  const listHeader = (
    <View>
      <Text style={styles.heading}>Prescription uploads</Text>
      <CachedDataNotice style={styles.notice} />
      <Button mode="outlined" onPress={() => selectImage('camera')} style={styles.spaced} icon="camera">
        Capture photo
      </Button>
      <Button
        mode="outlined"
        onPress={() =>
          selectImage('library')
        }
        style={styles.spaced}
        icon="image-multiple"
      >
        Choose from library
      </Button>

      {selectedAssets.length > 0 ? (
        <View style={[styles.assetList, styles.spaced]}>
          {selectedAssets.map((asset) => (
            <View key={asset.uri} style={styles.assetRow}>
              <Text style={styles.assetName}>{asset.name}</Text>
              <View style={styles.assetMeta}>
                {progressByAsset[asset.uri] !== undefined ? (
                  <ProgressBar progress={(progressByAsset[asset.uri] ?? 0) / 100} style={styles.assetProgress} />
                ) : null}
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => {
                    setSelectedAssets((current) => current.filter((item) => item.uri !== asset.uri));
                    setProgressByAsset((prev) => {
                      if (!(asset.uri in prev)) {
                        return prev;
                      }
                      const next = { ...prev };
                      delete next[asset.uri];
                      return next;
                    });
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <TextInput
        label="Patient ID"
        value={patientId}
        onChangeText={setPatientId}
        keyboardType="numeric"
        style={styles.spaced}
      />
      <TextInput
        label="Visit ID"
        value={visitId}
        onChangeText={setVisitId}
        keyboardType="numeric"
        style={styles.spaced}
      />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={styles.spaced}
      />
      <Button mode="contained" onPress={onUpload} loading={uploadMutation.isPending} style={styles.spaced} icon="cloud-upload">
        Upload
      </Button>

      <View style={styles.divider} />

      <Text style={styles.subheading}>Recent uploads</Text>
      <TextInput
        label="Filter by visit ID"
        value={visitFilter}
        onChangeText={setVisitFilter}
        keyboardType="numeric"
        style={styles.spaced}
      />
      <TextInput
        label="Filter by patient registration"
        value={patientFilter}
        onChangeText={setPatientFilter}
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.spaced}
      />
    </View>
  );

  if (uploadsQuery.isLoading && uploads.length === 0) {
    return <LoadingIndicator />;
  }

  if (uploadsQuery.isError) {
    return <ErrorState message="Unable to load uploads" onRetry={() => uploadsQuery.refetch()} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={styles.list}
        data={uploads}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUploadItem}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={uploadsQuery.isRefetching} onRefresh={() => uploadsQuery.refetch()} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No uploads yet</Text>
            <Text style={styles.emptySubtitle}>Capture a prescription to see it appear here.</Text>
          </View>
        )}
        ListFooterComponent={uploadsQuery.isFetching ? <ProgressBar indeterminate style={styles.footerLoader} /> : null}
      />

      <Portal>
        <Modal
          visible={!!selectedImage}
          onDismiss={() => setSelectedImage(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          {selectedImage ? (
            <View>
              <Image source={{ uri: selectedImage.image_url }} style={styles.modalImage} resizeMode="contain" />
              <Text style={styles.modalTitle}>Visit #{selectedImage.visit}</Text>
              <Text style={styles.modalSubtitle}>
                Uploaded {formatDistanceToNow(new Date(selectedImage.created_at), { addSuffix: true })}
              </Text>
              {selectedImage.drive_file_id ? (
                <Text style={styles.modalMeta}>Drive ID: {selectedImage.drive_file_id}</Text>
              ) : null}
              <Button mode="contained-tonal" onPress={() => setSelectedImage(null)} style={styles.closeButton}>
                Close
              </Button>
            </View>
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  spaced: {
    marginBottom: 12
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  cardSubtitle: {
    color: '#4b5563'
  },
  cardMeta: {
    color: '#6b7280',
    fontSize: 12
  },
  thumbnail: {
    width: 96,
    height: 96
  },
  separator: {
    height: 16
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  emptySubtitle: {
    color: '#6b7280',
    textAlign: 'center'
  },
  footerLoader: {
    marginTop: 16
  },
  modal: {
    margin: 24,
    padding: 16,
    borderRadius: 16
  },
  modalImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  modalSubtitle: {
    color: '#4b5563',
    marginTop: 4
  },
  modalMeta: {
    marginTop: 8,
    color: '#6b7280'
  },
  closeButton: {
    marginTop: 16
  },
  notice: {
    marginBottom: 12
  },
  assetList: {
    gap: 8
  },
  assetRow: {
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  assetName: {
    flex: 1,
    marginRight: 8,
    fontWeight: '500'
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  assetProgress: {
    width: 80,
    marginRight: 4
  }
});
