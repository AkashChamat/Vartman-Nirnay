import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PdfThumbnail = ({ pdfUrl, style, onPress }) => {
  const [loading, setLoading] = useState(false);

  // Simple PDF placeholder component
  const PdfPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <MaterialIcons name="picture-as-pdf" size={32} color="#E53E3E" />
      <Text style={styles.placeholderText}>PDF</Text>
      <Text style={styles.placeholderSubtext}>Tap to view</Text>
    </View>
  );

  // Handle case where no PDF URL is provided
  if (!pdfUrl) {
    return (
      <TouchableOpacity 
        style={[styles.container, style, styles.errorContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="description" size={24} color="#999" />
        <Text style={styles.errorText}>No PDF</Text>
      </TouchableOpacity>
    );
  }

  // If onPress is provided, make it touchable, otherwise just a view
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <PdfPlaceholder />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#5B95C4" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <PdfPlaceholder />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#5B95C4" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#6c757d',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  },
  placeholderSubtext: {
    color: '#6c757d',
    fontSize: 8,
    marginTop: 2,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 232, 240, 0.9)',
  },
  loadingText: {
    marginTop: 5,
    color: '#5B95C4',
    fontWeight: '500',
    fontSize: 10,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 232, 240, 0.9)',
  },
  errorText: {
    color: '#E53E3E',
    fontWeight: '500',
    fontSize: 10,
    marginTop: 4,
  },
});

export default PdfThumbnail;