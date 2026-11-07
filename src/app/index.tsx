import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference } from '@/theme/ThemePreferenceContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useThemePreference();

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  const imageWidth = Math.min(screenWidth * 0.78, 320);

  return (
    <ThemedView style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.topCircles} pointerEvents="none">
        <View style={[styles.circleLarge, { backgroundColor: primaryColor }]} />
        <View style={[styles.circleMedium, { backgroundColor: primaryColor }]} />
      </View>

      <View style={styles.bottomCircles} pointerEvents="none">
        <View style={[styles.circleSmall, { backgroundColor: secondaryColor }]} />
      </View>

      {/* Top bar theme toggle */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.8}
          style={[styles.themeChip, { backgroundColor: cardColor, borderColor }]}
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
            size={18}
            color={primaryColor}
          />
          <ThemedText style={[styles.themeChipText, { color: mutedColor }]}>
            {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}>
        <View style={styles.imageContainer}>
          <Image
            style={{ width: imageWidth, height: imageWidth * 0.78 }}
            source={require('@assets/home/img.png')}
            contentFit="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText type="title" style={styles.title}>
            Bắt Đầu Với CaféGo
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
            Quản lý quán café của bạn một cách dễ dàng và chuyên nghiệp
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Bắt Đầu Ngay"
            onPress={() => router.replace('/authscreen')}
            style={styles.startButton}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topCircles: {
    position: 'absolute',
    top: -80,
    left: -80,
    zIndex: 0,
  },
  circleLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.14,
    position: 'absolute',
    top: -30,
    left: 40,
  },
  circleMedium: {
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.09,
    position: 'absolute',
    top: 60,
    left: -20,
  },
  bottomCircles: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    zIndex: 0,
  },
  circleSmall: {
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.4,
  },
  topBar: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    zIndex: 2,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 12,
  },
  startButton: {
    minHeight: 54,
    borderRadius: 27,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
});
