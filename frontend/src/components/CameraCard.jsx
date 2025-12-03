import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';

const CameraCard = ({ camera }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
    console.log('CameraCard: Loading stream:', camera.stream_url);
  }, [camera.stream_url, camera.status]);

  const handleLoad = () => {
    console.log('CameraCard: Stream loaded successfully');
    setLoading(false);
    setError(false);
    setImageLoaded(true);
  };

  const handleError = (err) => {
    console.error('CameraCard: Stream error:', err || 'Unknown error');
    setLoading(false);
    setError(true);
  };

  // HTML for MJPEG stream - ensure image is visible
  const mjpegHTML = `
    <!DOCTYPE html>
    <html style="width: 100%; height: 100%; margin: 0; padding: 0;">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box;
        }
        html, body { 
          width: 100vw; 
          height: 100vh; 
          background: #000; 
          overflow: hidden; 
          position: fixed;
          margin: 0;
          padding: 0;
        }
        #img { 
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw !important; 
          height: 100vh !important; 
          object-fit: cover !important;
          display: block !important;
          z-index: 1;
        }
      </style>
    </head>
    <body style="width: 100vw; height: 100vh; margin: 0; padding: 0; background: #000;">
      <img id="img" />
      <script>
        (function() {
          var img = document.getElementById('img');
          var url = '${camera.stream_url}';
          var loaded = false;
          var timer;
          var errorCount = 0;
          
          // Set initial styles
          img.style.width = '100vw';
          img.style.height = '100vh';
          img.style.objectFit = 'cover';
          img.style.display = 'block';
          img.style.position = 'fixed';
          img.style.top = '0';
          img.style.left = '0';
          img.style.zIndex = '1';
          
          function update() {
            if (!img || !url) return;
            var separator = url.indexOf('?') >= 0 ? '&' : '?';
            var newSrc = url + separator + '_=' + new Date().getTime();
            img.src = newSrc;
          }
          
          img.onload = function() {
            console.log('Image loaded, dimensions:', img.width, 'x', img.height);
            errorCount = 0;
            if (!loaded && window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('loaded');
              loaded = true;
            }
            clearTimeout(timer);
            timer = setTimeout(update, 100);
          };
          
          img.onerror = function(e) {
            errorCount++;
            console.error('Image error #' + errorCount);
            if (window.ReactNativeWebView && !loaded) {
              window.ReactNativeWebView.postMessage('error');
            }
            if (errorCount < 10) {
              clearTimeout(timer);
              timer = setTimeout(update, 1000);
            }
          };
          
          console.log('Starting MJPEG stream:', url);
          update();
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.card}>
      <View style={styles.videoContainer}>
        {camera.stream_url && camera.status === 'active' ? (
          <>
            {isMJPEG ? (
              // MJPEG stream - use WebView with HTML img tag
              <WebView
                source={{ html: mjpegHTML }}
                style={styles.video}
                containerStyle={{ flex: 0 }}
                onMessage={(event) => {
                  const message = event.nativeEvent.data;
                  console.log('WebView message:', message);
                  if (message === 'loaded') {
                    handleLoad();
                  } else if (message === 'error') {
                    handleError();
                  }
                }}
                onLoadEnd={() => {
                  console.log('WebView load ended');
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                  handleError(nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView HTTP error:', nativeEvent.statusCode, nativeEvent.url);
                  // Only show error for non-200 status codes
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
                startInLoadingState={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                allowsBackForwardNavigationGestures={false}
                cacheEnabled={false}
                incognito={true}
                injectedJavaScript={`
                  (function() {
                    console.log('WebView injected script running');
                    console.log('Stream URL: ${camera.stream_url}');
                    setTimeout(function() {
                      var img = document.getElementById('img');
                      if (img) {
                        console.log('Image element found');
                        console.log('Image src:', img.src);
                        console.log('Image naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);
                        console.log('Image clientWidth:', img.clientWidth, 'clientHeight:', img.clientHeight);
                        console.log('Image offsetWidth:', img.offsetWidth, 'offsetHeight:', img.offsetHeight);
                        console.log('Image style:', img.style.cssText);
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage('debug:image-found');
                        }
                      } else {
                        console.error('Image element not found!');
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage('debug:image-not-found');
                        }
                      }
                    }, 1000);
                  })();
                  true;
                `}
              />
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
            
            {loading && !error && !imageLoaded && (
              <View style={styles.loadingOverlay}>
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
        {camera.stream_url && (
          <Text style={styles.streamUrl} numberOfLines={1}>
            🔗 {camera.stream_url}
          </Text>
        )}
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
  streamUrl: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});

export default CameraCard;
