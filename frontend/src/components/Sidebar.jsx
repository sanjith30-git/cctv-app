import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';

const Sidebar = (props) => {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CCTV System</Text>
        <Text style={styles.headerSubtitle}>
          {isOwner ? 'Owner Dashboard' : 'Control Room'}
        </Text>
      </View>

      <ScrollView style={styles.menu}>
        <DrawerItemList {...props} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Logged in as:</Text>
          <Text style={styles.username}>{user?.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  menu: {
    flex: 1,
    paddingTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  userInfo: {
    marginBottom: 16,
  },
  userLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Sidebar;
