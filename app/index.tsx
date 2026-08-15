import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/theme/Colors';
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from 'expo-router';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function HomeScreen() {
  const { colors } = useTheme();
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <ThemedView style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.topCircles}>
        <View style={[styles.circleLarge, { backgroundColor: primaryColor }]} />
        <View style={[styles.circleMedium, { backgroundColor: primaryColor }]} />
      </View>

      <View style={styles.bottomCircles}>
        <View style={[styles.circleSmall, { backgroundColor: Colors.light.secondary }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo/Image */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={require("../assets/home/img.png")}
            contentFit="contain"
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textContainer}>
          <ThemedText type="title" style={styles.title}>
            Bắt Đầu Với CaféGo
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Quản lý quán café của bạn một cách dễ dàng và chuyên nghiệp
          </ThemedText>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Bắt Đầu Ngay"
            onPress={() => router.replace("/authscreen")}
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
    position: "absolute",
    top: -80,
    left: -80,
    zIndex: 0,
  },

  circleLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
    position: "absolute",
    top: -30,
    left: 40,
  },

  circleMedium: {
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.1,
    position: "absolute",
    top: 60,
    left: -20,
  },

  bottomCircles: {
    position: "absolute",
    bottom: -60,
    right: -60,
    zIndex: 0,
  },

  circleSmall: {
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.08,
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
    marginBottom: 32,
  },

  image: {
    width: Math.min(screenWidth * 0.85, 400),
    height: Math.min(screenWidth * 0.85, 400) * 0.8,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },

  title: {
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 24,
    maxWidth: 320,
  },

  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 20,
  },

  startButton: {
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
