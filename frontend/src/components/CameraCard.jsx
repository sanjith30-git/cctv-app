import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';

const CameraCard = ({ camera }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const webViewRef = useRef(null);

  // Detect stream type - MJPEG streams typically use /video_feed endpoint
  const isMJPEG = camera.stream_url?.includes('/video_feed') || 
                  camera.stream_url?.includes('mjpeg');
  
  // For non-MJPEG video streams, use expo-video player
  // Only create player if not MJPEG and stream URL exists
  const videoUrl = !isMJPEG && camera.stream_url ? camera.stream_url : '';
  const player = useVideoPlayer(videoUrl, (player) => {
    if (player && videoUrl) {
      player.loop = true;
      player.play();
    }
  });
  
  useEffect(() => {
    // Reset loading state when camera changes
    setLoading(true);
    setError(false);
    setImageLoaded(false);
  }, [camera.stream_url, camera.status]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    setImageLoaded(true);
  };

  const handleError = (err) => {
    console.error('CameraCard: Stream error:', err || 'Unknown error');
    setLoading(false);
    setError(true);
  };

  // HTML for MJPEG stream - memoized to prevent re-renders
  const mjpegHTML = useMemo(() => {
    const streamUrl = camera.stream_url || '';
    const escapedUrl = streamUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; background: #000; overflow: hidden; position: fixed; }
#img { 
  width: 100vw !important; 
  height: 100vh !important; 
  object-fit: cover !important; 
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 9999 !important;
  background: #000 !important;
}
</style>
</head>
<body style="margin:0;padding:0;background:#000;overflow:hidden;">
<img id="img" />
<script>
(function() {
  var img = document.getElementById('img');
  var url = '${escapedUrl}';
  var timer = null;
  var loaded = false;
  var errorCount = 0;
  
  if (!img || !url) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('error:missing');
    return;
  }
  
  // Set initial styles immediately
  img.style.cssText = 'width:100vw !important;height:100vh !important;object-fit:cover !important;display:block !important;visibility:visible !important;opacity:1 !important;position:fixed !important;top:0 !important;left:0 !important;z-index:9999 !important;background:#000 !important;';
  
  function updateImage() {
    if (!img || !url) return;
    try {
      var sep = url.indexOf('?') >= 0 ? '&' : '?';
      var timestamp = new Date().getTime();
      var newUrl = url + sep + 't=' + timestamp;
      
      // Directly set src - don't wait
      img.src = newUrl;
      
      // Force visibility
      img.style.display = 'block';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
    } catch(e) {
      console.error('Update error:', e);
    }
  }
  
  img.onload = function() {
    errorCount = 0;
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    
    if (!loaded && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('loaded');
      loaded = true;
    }
    
    clearTimeout(timer);
    timer = setTimeout(updateImage, 50);
  };
  
  img.onerror = function() {
    errorCount++;
    img.style.display = 'block';
    img.style.visibility = 'visible';
    
    if (window.ReactNativeWebView && !loaded && errorCount === 1) {
      window.ReactNativeWebView.postMessage('error');
    }
    
    if (errorCount < 20) {
      clearTimeout(timer);
      timer = setTimeout(updateImage, 500);
    }
  };
  
  // Continuous visibility check
  setInterval(function() {
    if (img) {
      img.style.display = 'block';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
      if (!img.src || img.src === '' || img.src === window.location.href) {
        updateImage();
      }
    }
  }, 100);
  
  // Start loading
  updateImage();
})();
</script>
</body>
</html>`;
  }, [camera.stream_url]);

  return (
    <View style={styles.card}>
      <View style={styles.videoContainer}>
        {camera.stream_url && camera.status === 'active' ? (
          <>
            {isMJPEG ? (
              // MJPEG stream - use WebView with HTML img tag
              <View style={styles.video}>
                <WebView
                  ref={webViewRef}
                  source={{ html: mjpegHTML }}
                  style={StyleSheet.absoluteFill}
                  onMessage={(event) => {
                    const message = event.nativeEvent.data;
                    if (message === 'loaded') {
                      handleLoad();
                    } else if (message.startsWith('error')) {
                      handleError();
                    }
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent);
                    handleError(nativeEvent);
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    if (nativeEvent.statusCode >= 400) {
                      handleError(nativeEvent);
                    }
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={false}
                  scalesPageToFit={true}
                  scrollEnabled={false}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  mixedContentMode="always"
                  originWhitelist={['*']}
                  startInLoadingState={false}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  allowsBackForwardNavigationGestures={false}
                  cacheEnabled={false}
                  incognito={false}
                  androidHardwareAccelerationDisabled={false}
                />
              </View>
            ) : (
              // Video stream - use expo-video VideoView component
              <VideoView
                player={player}
                style={styles.video}
                contentFit="cover"
                nativeControls={false}
                allowsFullscreen={false}
                onLoadStart={handleLoad}
                onError={handleError}
              />
            )}
            
            {loading && !error && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading stream...</Text>
                <Text style={styles.loadingText} numberOfLines={1}>
                  {camera.stream_url}
                </Text>
              </View>
            )}
            
            {error && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>Stream unavailable</Text>
                <Text style={styles.errorSubtext}>{camera.name}</Text>
                <Text style={styles.errorSubtext} numberOfLines={2}>
                  {camera.stream_url}
                </Text>
                <Text style={styles.errorSubtext}>
                  Check: Stream server running? Same network?
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📹</Text>
            <Text style={styles.placeholderText}>
              {camera.status === 'active' ? 'No stream URL' : 'Camera Offline'}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.statusBadge,
          camera.status === 'active' ? styles.statusActive : styles.statusInactive
        ]}>
          <Text style={styles.statusText}>{camera.status}</Text>
        </View>
        
        {camera.device && (
          <View style={styles.deviceBadge}>
            <Text style={styles.deviceText}>{camera.device}</Text>
          </View>
        )}
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
    backgroundColor: '#000',
    aspectRatio: 16 / 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    flex: 1,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
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
    zIndex: 10,
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
  deviceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  deviceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    marginBottom: 2,
  },
});

export default CameraCard;
