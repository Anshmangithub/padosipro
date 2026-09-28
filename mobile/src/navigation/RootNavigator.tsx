import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TaskSelectionScreen } from '../screens/TaskSelectionScreen';
import { HomeScreen } from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Routing is driven entirely by auth/onboarding state rather than manual
// navigation.reset() calls: as `status`/`isAuthenticated`/`session` change,
// the set of registered screens changes, and React Navigation mounts a fresh
// stack for it. That's what makes "can't navigate back into a finished
// onboarding step" fall out for free instead of needing explicit resets.
export function RootNavigator() {
  const { status, isAuthenticated, session } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'loading' ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Group>
        ) : !session?.hasProfile ? (
          <Stack.Screen name="Profile" component={ProfileScreen} />
        ) : !session?.hasSelectedTasks ? (
          <Stack.Screen name="TaskSelection" component={TaskSelectionScreen} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="TaskSelection" component={TaskSelectionScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
