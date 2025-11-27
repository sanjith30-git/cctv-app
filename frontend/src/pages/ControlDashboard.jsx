import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import CameraCard from '../components/CameraCard';
import CustomDrawer from '../components/CustomDrawer';

const ControlDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('cameras');
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [camerasResponse, alertsResponse] = await Promise.all([
        api.get('/cameras'),
        api.get('/alerts'),
      ]);
      setCameras(camerasResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        role="control_room"
        navigation={navigation}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Control Room Dashboard</Text>
          <Text style={styles.headerSubtitle}>Monitor all CCTV cameras and alerts</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cameras' && styles.tabActive]}
          onPress={() => setActiveTab('cameras')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'cameras' && styles.tabTextActive
          ]}>
            📹 Cameras ({cameras.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'alerts' && styles.tabTextActive
          ]}>
            🚨 Alerts ({alerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'cameras' ? (
          <>
            {cameras.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No cameras found.</Text>
              </View>
            ) : (
              <View style={styles.cameraGrid}>
                {cameras.map((camera) => (
                  <CameraCard key={camera.id} camera={camera} />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {alerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No alerts at this time.</Text>
              </View>
            ) : (
              <View style={styles.alertsContainer}>
                {alerts.map((alert) => (
                  <View
                    key={alert.id}
                    style={[
                      styles.alertCard,
                      alert.severity === 'high' && styles.alertHigh,
                      alert.severity === 'medium' && styles.alertMedium,
                      alert.severity === 'low' && styles.alertLow,
                    ]}
                  >
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>🚨</Text>
                      <Text style={styles.alertCameraName}>{alert.camera_name}</Text>
                      <View style={[
                        styles.alertSeverity,
                        alert.severity === 'high' && styles.alertSeverityHigh,
                        alert.severity === 'medium' && styles.alertSeverityMedium,
                        alert.severity === 'low' && styles.alertSeverityLow,
                      ]}>
                        <Text style={styles.alertSeverityText}>
                          {alert.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertLocation}>📍 {alert.location}</Text>
                      <Text style={styles.alertTime}>
                        🕐 {new Date(alert.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#1F2937',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#4F46E5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  cameraGrid: {
    gap: 16,
  },
  alertsContainer: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHigh: {
    borderLeftColor: '#EF4444',
  },
  alertMedium: {
    borderLeftColor: '#F59E0B',
  },
  alertLow: {
    borderLeftColor: '#3B82F6',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertCameraName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  alertSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertSeverityHigh: {
    backgroundColor: '#FEE2E2',
  },
  alertSeverityMedium: {
    backgroundColor: '#FEF3C7',
  },
  alertSeverityLow: {
    backgroundColor: '#DBEAFE',
  },
  alertSeverityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  alertLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ControlDashboard;
