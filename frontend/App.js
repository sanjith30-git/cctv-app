import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from './src/pages/Login';
import OwnerDashboard from './src/pages/OwnerDashboard';
import ControlDashboard from './src/pages/ControlDashboard';
import Settings from './src/pages/Settings';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={Login} />
        ) : (
          <>
            {user.role === 'owner' ? (
          <Stack.Screen name="Owner" component={OwnerDashboard} />
        ) : (
          <Stack.Screen name="Control" component={ControlDashboard} />
            )}
            <Stack.Screen name="Settings" component={Settings} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

