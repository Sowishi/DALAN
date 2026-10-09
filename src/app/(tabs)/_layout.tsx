import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { LocalDataGate } from '@/components/local-data-gate';
import { Colors } from '@/constants/theme';
import { AssistantProvider } from '@/context/assistant-provider';
import { useAuth } from '@/context/auth-provider';

export default function TabsLayout() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: Colors.light.background }} />;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <LocalDataGate>
    <AssistantProvider>
    <Tabs
      initialRouteName="ask"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Dally',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, size }) => <Ionicons name="add" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="move"
        options={{
          title: 'Move',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="run" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </AssistantProvider>
    </LocalDataGate>
  );
}
