import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './screens/LoginScreen';
import PatientDashboard from './screens/PatientDashboard';
import PatientReport from './screens/PatientReport';
import DoctorDashboard from './screens/DoctorDashboard';

// Store
import { initStore, getCurrentUser } from './utils/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Patient Tabs
function PatientTabs({ user, setUser }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(24, 24, 27, 0.85)', // Glass effect
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          elevation: 0,
          borderRadius: 24,
          height: 70,
          borderTopWidth: 0,
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#0ea5e9', // Electric Blue
        tabBarInactiveTintColor: '#52525b',
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Report') iconName = focused ? 'analytics' : 'analytics-outline';

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: 5 }}>
              <Ionicons name={iconName} size={28} color={color} />
              {focused && (
                 <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginTop: 4 }} />
              )}
            </View>
          );
        }
      })}
    >
      <Tab.Screen name="Home">
        {props => <PatientDashboard {...props} user={user} setUser={setUser} />}
      </Tab.Screen>
      <Tab.Screen name="Report">
        {props => <PatientReport {...props} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setup = async () => {
      await initStore();
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    setup();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer theme={{colors: {background: '#09090b'}}}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} setUser={setUser} />}
          </Stack.Screen>
        ) : user.role === 'Patient' ? (
          <Stack.Screen name="PatientApp">
            {props => <PatientTabs {...props} user={user} setUser={setUser} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="DoctorApp">
            {props => <DoctorDashboard {...props} user={user} setUser={setUser} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
