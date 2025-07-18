import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PdfViewer = ({route, navigation}) => {
  const {pdfUrl, title} = route.params;
  const [loading, setLoading] = useState(true);
  
  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  const customUserAgent = 
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36';

  // This script intercepts and prevents downloads
  const injectedJavaScript = `
    (function() {
      // Intercept and prevent download triggers
      document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('download')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
      
      // Hide any download buttons that might appear in Google's PDF viewer
      const hideDownloadButtons = () => {
        const downloadButtons = document.querySelectorAll('[aria-label="Download"], [data-message="download"]');
        downloadButtons.forEach(button => {
          button.style.display = 'none';
        });
      };
      
      // Run initially and also set a recurring check
      hideDownloadButtons();
      setInterval(hideDownloadButtons, 1000);
      
      // This helps with Google Docs PDF viewer
      if (document.querySelector('embed[type="application/pdf"]')) {
        const embed = document.querySelector('embed[type="application/pdf"]');
        embed.setAttribute('disabledownload', 'true');
      }
    })();
    true;
  `;

  // Check if the URL is a direct PDF or needs a viewer
  const getPdfViewerUrl = (url) => {
    // If it's already a Google viewer URL, return as is
    if (url.includes('docs.google.com/viewer')) {
      return url;
    }
    
    // For direct PDF URLs, wrap in Google's PDF viewer for better compatibility
    // This approach displays PDFs without triggering downloads
    return `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || "PDF Viewer"}</Text>
        <View style={styles.placeholder}></View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B95C4" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}

      <WebView
        source={{uri: getPdfViewerUrl(pdfUrl)}}
        style={styles.webview}
        onError={(syntheticEvent) => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        onLoadEnd={() => setLoading(false)}
        userAgent={customUserAgent}
        injectedJavaScript={injectedJavaScript}
        onShouldStartLoadWithRequest={(request) => {
          // Block download attempts and only allow proper viewing URLs
          if (request.url.endsWith('.pdf') && request.navigationType === 'click') {
            return false; // Block direct PDF downloads when clicked
          }
          return true;
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#5B95C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
    marginRight: 5,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 247, 250, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0288D1',
    fontWeight: '500',
  },
});

export default PdfViewer;