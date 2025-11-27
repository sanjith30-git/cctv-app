import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CameraCard = ({ camera }) => {
  return (
    <View style={styles.card}>
      <View style={styles.videoContainer}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📹</Text>
          <Text style={styles.placeholderText}>{camera.name}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          camera.status === 'active' ? styles.statusActive : styles.statusInactive
        ]}>
          <Text style={styles.statusText}>{camera.status}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.cameraName}>{camera.name}</Text>
        <Text style={styles.location}>📍 {camera.location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  videoContainer: {
    backgroundColor: '#111827',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  info: {
    padding: 12,
  },
  cameraName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default CameraCard;
