import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DATABASE_NAME } from "@/constants/app";
import { initDatabase } from "@/database/schema";
import { AppDarkTheme, AppLightTheme } from "@/theme/AppTheme";
import { Colors } from "@/theme/Colors";
import { ThemePreferenceProvider, useThemePreference } from "@/theme/ThemePreferenceContext";

function AppNavigator() {
  const { isDark } = useThemePreference();
  const currentTheme = isDark ? Colors.dark : Colors.light;

  const defaultHeaderOptions = {
    headerTitleStyle: {
      fontSize: 17,
      fontFamily: "PoppinsBold",
      color: currentTheme.text,
    },
    headerTitleAlign: "center" as const,
    headerStyle: {
      backgroundColor: currentTheme.card,
    },
    headerTintColor: currentTheme.primary,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackTitle: "",
    contentStyle: {
      backgroundColor: currentTheme.background,
    },
  };

  return (
    <ThemeProvider value={isDark ? AppDarkTheme : AppLightTheme}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Stack screenOptions={defaultHeaderOptions}>
          <Stack.Screen
            name="index"
            options={{
              title: "Chào Mừng",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="(auth)/authscreen"
            options={{
              title: "Đăng Nhập",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="(auth)/RequestResetScreen"
            options={{
              title: "Quên Mật Khẩu",
            }}
          />

          <Stack.Screen
            name="(auth)/ConfirmResetScreen"
            options={{
              title: "Đặt Lại Mật Khẩu",
            }}
          />

          <Stack.Screen
            name="(auth)/EmailVerificationScreen"
            options={{
              title: "Xác Minh Email",
            }}
          />

          <Stack.Screen
            name="dashboard"
            options={{
              title: "Trang Chủ",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="(account)/account"
            options={{
              title: "Tài Khoản Của Tôi",
            }}
          />

          <Stack.Screen
            name="(account)/chinhsuaaccount"
            options={{
              title: "Chỉnh Sửa Tài Khoản",
            }}
          />

          <Stack.Screen
            name="(orders)/payment"
            options={{
              title: "Thanh Toán",
            }}
          />

          <Stack.Screen
            name="(orders)/table"
            options={{
              title: "Sơ Đồ Bàn",
            }}
          />

          <Stack.Screen
            name="(management)/themban"
            options={{
              title: "Thông Tin Bàn",
            }}
          />

          <Stack.Screen
            name="(management)/quanlyban"
            options={{
              title: "Quản Lý Bàn",
            }}
          />

          <Stack.Screen
            name="(orders)/chitietban"
            options={{
              title: "Chi Tiết Bàn",
            }}
          />

          <Stack.Screen
            name="(orders)/hoadonban"
            options={{
              title: "Gọi Món",
            }}
          />

          <Stack.Screen
            name="(management)/menu"
            options={{
              title: "Quản Lý Thực Đơn",
            }}
          />

          <Stack.Screen
            name="(management)/quanlynhommon"
            options={{
              title: "Quản Lý Nhóm Món",
            }}
          />

          <Stack.Screen
            name="(management)/themnhommon"
            options={{
              title: "Thông Tin Nhóm Món",
            }}
          />

          <Stack.Screen
            name="(management)/themmon"
            options={{
              title: "Thông Tin Món",
            }}
          />

          <Stack.Screen
            name="(orders)/quanlyhoadon"
            options={{
              title: "Quản Lý Hóa Đơn",
            }}
          />

          <Stack.Screen
            name="+not-found"
            options={{
              title: "Không Tìm Thấy Trang",
            }}
          />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </SQLiteProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("@assets/fonts/SpaceMono-Regular.ttf"),
    Poppins: require("@assets/fonts/FZ Poppins-Regular.ttf"),
    PoppinsExtraBold: require("@assets/fonts/FZ Poppins-ExtraBold.ttf"),
    PoppinsBold: require("@assets/fonts/FZ Poppins-Bold.ttf"),
    PoppinsItalic: require("@assets/fonts/FZ Poppins-Italic.ttf"),
    PoppinsBoldItalic: require("@assets/fonts/FZ Poppins-BoldItalic.ttf"),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FBF8F4" }}>
        <ActivityIndicator size="large" color="#B5451B" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <AppNavigator />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
