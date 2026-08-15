import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AppDarkTheme, AppLightTheme } from '@/theme/AppTheme';
import { Colors } from "@/theme/Colors";

import { type SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import React from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Poppins: require("../assets/fonts/FZ Poppins-Regular.ttf"),
    PoppinsExtraBold: require("../assets/fonts/FZ Poppins-ExtraBold.ttf"),
    PoppinsBold: require("../assets/fonts/FZ Poppins-Bold.ttf"),
    PoppinsItalic: require("../assets/fonts/FZ Poppins-Italic.ttf"),
    PoppinsBoldItalic: require("../assets/fonts/FZ Poppins-BoldItalic.ttf")
  });

  const initDb = async (db: SQLiteDatabase) => {
    try {
      console.log("creating database if needed");
      await db.execAsync("CREATE TABLE IF NOT EXISTS ban (MaBan INTEGER PRIMARY KEY AUTOINCREMENT, TenBan TEXT NOT NULL, TrangThai TEXT NOT NULL, userId TEXT NOT NULL);");
      await db.execAsync("CREATE TABLE IF NOT EXISTS chitiethd (MaChiTietHD INTEGER PRIMARY KEY AUTOINCREMENT, MaHoaDon INTEGER NOT NULL, MaMon INTEGER NOT NULL, SoLuong INTEGER NOT NULL, Gia INTEGER NOT NULL, userId TEXT NOT NULL);");
      await db.execAsync("CREATE TABLE IF NOT EXISTS hoadon (MaHoaDon INTEGER PRIMARY KEY AUTOINCREMENT, GiamGia INTEGER DEFAULT NULL, MaBan INTEGER NOT NULL, GioDen DATETIME NOT NULL, TongTien INTEGER DEFAULT NULL, TrangThai INTEGER DEFAULT 0, userId TEXT NOT NULL )");
      await db.execAsync("CREATE TABLE IF NOT EXISTS nhommon (MaLoai INTEGER PRIMARY KEY AUTOINCREMENT, TenLoai TEXT NOT NULL, userId TEXT NOT NULL);");
      await db.execAsync("CREATE TABLE IF NOT EXISTS menu (MaMon INTEGER PRIMARY KEY AUTOINCREMENT, TenMon TEXT NOT NULL, MaLoai INTEGER NOT NULL, DonGia INTEGER NOT NULL, DVT TEXT NOT NULL, userId TEXT NOT NULL);");
    } catch (error) {
      console.error("DB init error:", error);
    }
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FBF8F4" }}>
        <ActivityIndicator size="large" color="#B5451B" />
      </View>
    );
  }
  const isDark = colorScheme === 'dark';
  const currentTheme = isDark ? Colors.dark : Colors.light;

  const defaultHeaderOptions = {
    headerTitleStyle: {
      fontSize: 18,
      fontFamily: "PoppinsBold",
      color: currentTheme.text,
    },
    headerTitleAlign: "center" as const,
    headerStyle: {
      backgroundColor: currentTheme.card,
    },
    headerTintColor: currentTheme.primary,
    headerShadowVisible: false,
  };

  return (
    <ThemeProvider value={isDark ? AppDarkTheme : AppLightTheme}>
      <SQLiteProvider databaseName="qlcafe.db" onInit={initDb}>
        <Stack screenOptions={defaultHeaderOptions}>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="authscreen"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="RequestResetScreen"
            options={{
              title: "Đặt Lại Mật Khẩu",
              headerBackVisible: false,
            }}
          />

          <Stack.Screen
            name="ConfirmResetScreen"
            options={{
              title: "Xác Nhận Yêu Cầu",
              headerBackVisible: false,
            }}
          />

          <Stack.Screen
            name="EmailVerificationScreen"
            options={{
              title: "Xác Minh Email",
              headerBackVisible: false,
            }}
          />

          <Stack.Screen
            name="dashboard"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="account"
            options={{
              title: "Tài Khoản Của Tôi",
            }}
          />

          <Stack.Screen
            name="chinhsuaaccount"
            options={{
              title: "Chỉnh Sửa Tài Khoản",
            }}
          />

          <Stack.Screen
            name="payment"
            options={{
              title: "Thanh Toán",
            }}
          />

          <Stack.Screen
            name="table"
            options={{
              title: "Chọn Bàn",
            }}
          />

          <Stack.Screen
            name="themban"
            options={{
              title: "Thêm Bàn Mới",
            }}
          />

          <Stack.Screen
            name="quanlyban"
            options={{
              title: "Quản Lý Bàn",
            }}
          />

          <Stack.Screen
            name="chitietban"
            options={{
              title: "Chi Tiết Bàn",
            }}
          />

          <Stack.Screen
            name="hoadonban"
            options={{
              title: "Gọi Món",
            }}
          />

          <Stack.Screen
            name="menu"
            options={{
              title: "Quản Lý Thực Đơn",
            }}
          />

          <Stack.Screen
            name="quanlynhommon"
            options={{
              title: "Quản Lý Nhóm Món",
            }}
          />

          <Stack.Screen
            name="themnhommon"
            options={{
              title: "Nhóm Món",
            }}
          />

          <Stack.Screen
            name="themmon"
            options={{
              title: "Món Ăn & Đồ Uống",
            }}
          />

          <Stack.Screen
            name="quanlyhoadon"
            options={{
              title: "Quản Lý Hóa Đơn",
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </SQLiteProvider>
    </ThemeProvider>
  );
}
