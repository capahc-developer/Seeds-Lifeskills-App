import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  Redirect,
  Tabs,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function TabLayout() {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(firebaseUser);

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          "#55A8F7",

        tabBarInactiveTintColor:
          "#9CA3AF",

        tabBarStyle: {
          height: 70,

          paddingTop: 8,

          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: "Log",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="clipboard-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="resources"
        options={{
          title: "Resources",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="book-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}