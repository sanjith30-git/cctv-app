import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Modal, 
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  TextInput,
  Alert
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraCard = ({ camera, onStatusUpdate, index = 0, onNameUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(camera.name);
  const [updatingName, setUpdatingName] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const webViewRef = useRef(null);
  const fullscreenWebViewRef = useRef(null);
  const errorCountRef = useRef(0);
  const statusUpdateAttemptedRef = useRef(false);
  const isOwner = user?.role === 'owner';
  
  // Zoom and pan for fullscreen
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });
  
  // Card entrance animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateX = useRef(new Animated.Value(-10)).current;
  const locationOpacity = useRef(new Animated.Value(0)).current;
  const statusBadgeScale = useRef(new Animated.Value(0)).current;
  const actionButtonsOpacity = useRef(new Animated.Value(0)).current;

  // Detect stream type - MJPEG streams typically use /video_feed endpoint
  const isMJPEG = camera.stream_url?.includes('/video_feed') || 
                  camera.stream_url?.includes('mjpeg');
  
  // For non-MJPEG video streams, use expo-video player
  // Only create player if not MJPEG and stream URL exists
  // Pass null instead of empty string to avoid loading invalid URLs
  const videoUrl = !isMJPEG && camera.stream_url ? camera.stream_url : null;
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
    errorCountRef.current = 0;
    statusUpdateAttemptedRef.current = false;
    setEditedName(camera.name);
    setIsEditingName(false);
  }, [camera.stream_url, camera.status, camera.name, refreshKey]);

  // Monitor orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscape = window.width > window.height;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    });
    
    // Set initial orientation
    const initialIsLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
    setOrientation(initialIsLandscape ? 'landscape' : 'portrait');
    
    return () => subscription?.remove();
  }, []);

  // Entrance animations
  useEffect(() => {
    // Reset animation values before starting
    cardOpacity.setValue(0);
    cardTranslateY.setValue(20);
    titleOpacity.setValue(0);
    titleTranslateX.setValue(-10);
    locationOpacity.setValue(0);
    statusBadgeScale.setValue(0);
    actionButtonsOpacity.setValue(0);
    
    // Staggered entrance animation
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100 + 200,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateX, {
        toValue: 0,
        duration: 500,
        delay: index * 100 + 200,
        useNativeDriver: true,
      }),
      Animated.timing(locationOpacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100 + 300,
        useNativeDriver: true,
      }),
      Animated.spring(statusBadgeScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        delay: index * 100 + 400,
        useNativeDriver: true,
      }),
      Animated.timing(actionButtonsOpacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100 + 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  // Reset zoom/pan when closing fullscreen
  useEffect(() => {
    if (!fullscreenVisible) {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      lastScale.current = 1;
      lastTranslate.current = { x: 0, y: 0 };
    }
  }, [fullscreenVisible]);

  // Pan responder for zoom and pan gestures
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        return evt.nativeEvent.touches.length >= 1;
      },
      onMoveShouldSetPanResponder: (evt) => {
        return evt.nativeEvent.touches.length >= 1;
      },
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          initialDistance.current = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          initialScale.current = lastScale.current;
        }
        scale.setOffset(lastScale.current);
        translateX.setOffset(lastTranslate.current.x);
        translateY.setOffset(lastTranslate.current.y);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          if (initialDistance.current > 0) {
            const newScale = Math.max(1, Math.min(4, (distance / initialDistance.current) * initialScale.current));
            scale.setValue(newScale);
          }
        } else if (evt.nativeEvent.touches.length === 1) {
          // Pan (only if zoomed)
          if (lastScale.current > 1) {
            translateX.setValue(gestureState.dx);
            translateY.setValue(gestureState.dy);
          }
        }
      },
      onPanResponderRelease: () => {
        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
        lastScale.current = scale._value;
        lastTranslate.current = { x: translateX._value, y: translateY._value };
        initialDistance.current = 0;
      },
    })
  ).current;

  const lastTap = useRef(0);
  
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected - reset zoom and pan
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        lastScale.current = 1;
        lastTranslate.current = { x: 0, y: 0 };
      });
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLoading(true);
    setError(false);
    setImageLoaded(false);
    errorCountRef.current = 0;
    statusUpdateAttemptedRef.current = false;
    
    // Reload WebView
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    if (fullscreenWebViewRef.current) {
      fullscreenWebViewRef.current.reload();
    }
  };

  const handleFullscreen = () => {
    setFullscreenVisible(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreenVisible(false);
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditedName(camera.name);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(camera.name);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Camera name cannot be empty');
      return;
    }

    if (editedName.trim() === camera.name) {
      setIsEditingName(false);
      return;
    }

    setUpdatingName(true);
    try {
      await api.patch(`/cameras/${camera.id}/name`, {
        name: editedName.trim(),
      });
      
      setIsEditingName(false);
      if (onNameUpdate) {
        onNameUpdate();
      }
    } catch (error) {
      console.error('Error updating camera name:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update camera name';
      Alert.alert('Error', errorMessage);
      setEditedName(camera.name);
    } finally {
      setUpdatingName(false);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    setImageLoaded(true);
    // Reset error count on successful load
    errorCountRef.current = 0;
    statusUpdateAttemptedRef.current = false;
    
    // Animate status badge on load
    Animated.spring(statusBadgeScale, {
      toValue: 1.2,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(statusBadgeScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();
    });
    
    // If camera was inactive and stream is now working, set it back to active
    if (camera.status === 'inactive') {
      updateCameraStatus('active');
    }
  };

  const updateCameraStatus = async (newStatus) => {
    if (statusUpdateAttemptedRef.current) return; // Prevent multiple attempts
    
    try {
      statusUpdateAttemptedRef.current = true;
      await api.patch(`/cameras/${camera.id}/status?status=${newStatus}`);
      
      // Notify parent component to refresh camera list
      if (onStatusUpdate) {
        onStatusUpdate(camera.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to update camera status:', error);
      statusUpdateAttemptedRef.current = false; // Allow retry on error
    }
  };

  const handleError = (err) => {
    console.error('CameraCard: Stream error:', err || 'Unknown error');
    setLoading(false);
    setError(true);
    
    // Increment error count
    errorCountRef.current += 1;
    
    // After 5 consecutive errors, mark camera as inactive
    if (camera.status === 'active' && errorCountRef.current >= 5 && !statusUpdateAttemptedRef.current) {
      updateCameraStatus('inactive');
    }
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
    <Animated.View 
      style={[
        styles.card,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
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
            ) : videoUrl && player ? (
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
            ) : null}
            
            {loading && !error && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color="#06B6D4" />
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
            
            {/* Action buttons */}
            {camera.stream_url && camera.status === 'active' && (
              <Animated.View 
                style={[
                  styles.actionButtons,
                  {
                    opacity: actionButtonsOpacity,
                  },
                ]}
              >
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleFullscreen}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>⛶</Text>
                </TouchableOpacity>
              </Animated.View>
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
        
        <Animated.View 
          style={[
            styles.statusBadge,
            camera.status === 'active' ? styles.statusActive : styles.statusInactive,
            {
              transform: [{ scale: statusBadgeScale }],
            },
          ]}
        >
          <Text style={styles.statusText}>{camera.status}</Text>
        </Animated.View>
        
        {camera.device && (
          <View style={styles.deviceBadge}>
            <Text style={styles.deviceText}>{camera.device}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Animated.View
          style={{
            opacity: 1,
            transform: [{ translateX: titleTranslateX }],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Camera name"
                autoFocus
                editable={!updatingName}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveName}
                disabled={updatingName}
              >
                {updatingName ? (
                  <ActivityIndicator size="small" color="#06B6D4" />
                ) : (
                  <Text style={styles.saveButtonText}>✓</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={updatingName}
              >
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.cameraName}>{camera.name}</Text>
              {isOwner && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditName}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
        <Animated.View
          style={{
            opacity: locationOpacity,
          }}
        >
          <Text style={styles.location}>📍 {camera.location}</Text>
        </Animated.View>
      </View>
      
      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={handleCloseFullscreen}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={[
          styles.fullscreenContainer,
          orientation === 'landscape' && styles.fullscreenContainerLandscape
        ]}>
          {orientation === 'portrait' && (
            <View style={styles.fullscreenHeader}>
              <Text style={styles.fullscreenTitle}>{camera.name}</Text>
              <View style={styles.fullscreenButtons}>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullscreenButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={handleCloseFullscreen}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullscreenButtonText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {orientation === 'landscape' && (
            <View style={styles.fullscreenHeaderLandscape}>
              <Text style={styles.fullscreenTitleLandscape}>{camera.name}</Text>
              <View style={styles.fullscreenButtons}>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={handleRefresh}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullscreenButtonText}>🔄</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={handleCloseFullscreen}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullscreenButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <Animated.View
            style={[
              styles.fullscreenContent,
              {
                transform: [
                  { scale: scale },
                  { translateX: translateX },
                  { translateY: translateY },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => false}
            >
            {isMJPEG ? (
              <WebView
                ref={fullscreenWebViewRef}
                key={`fullscreen-${refreshKey}`}
                source={{ html: mjpegHTML }}
                style={styles.fullscreenWebView}
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
            ) : videoUrl && player ? (
              <VideoView
                player={player}
                style={styles.fullscreenVideo}
                contentFit="contain"
                nativeControls={false}
                allowsFullscreen={false}
                onLoadStart={handleLoad}
                onError={handleError}
              />
            ) : null}
            </View>
          </Animated.View>
          
          {loading && !error && (
            <View style={styles.fullscreenLoadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#06B6D4" />
              <Text style={styles.fullscreenLoadingText}>Loading stream...</Text>
            </View>
          )}
          
          {error && (
            <View style={styles.fullscreenErrorOverlay}>
              <Text style={styles.fullscreenErrorIcon}>⚠️</Text>
              <Text style={styles.fullscreenErrorText}>Stream unavailable</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={handleRefresh}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.fullscreenHint}
            onPress={handleDoubleTap}
            activeOpacity={0.7}
          >
            <Text style={styles.fullscreenHintText}>
              Pinch to zoom • Drag to pan • Tap here to reset zoom
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Animated.View>
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
    backgroundColor: '#06B6D4',
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
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
    flex: 1,
    opacity: 1,
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
    marginBottom: 4,
  },
  editButtonText: {
    fontSize: 16,
    opacity: 1,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#06B6D4',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#fff',
    opacity: 1,
  },
  saveButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#10B981',
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 1,
  },
  cancelButton: {
    marginLeft: 4,
    padding: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 1,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainerLandscape: {
    flexDirection: 'row',
  },
  fullscreenHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fullscreenHeaderLandscape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 12,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  fullscreenTitleLandscape: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  fullscreenButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fullscreenButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fullscreenButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fullscreenWebView: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 100,
  },
  fullscreenVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 100,
  },
  fullscreenLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenLoadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  fullscreenErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fullscreenErrorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  fullscreenErrorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenHint: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fullscreenHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default CameraCard;
