import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'small';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const defaultColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const primaryColor = useThemeColor({}, 'primary');

  const typeStyle =
    type === 'title'
      ? styles.title
      : type === 'defaultSemiBold'
        ? styles.defaultSemiBold
        : type === 'subtitle'
          ? styles.subtitle
          : type === 'link'
            ? styles.link
            : type === 'caption'
              ? styles.caption
              : type === 'small'
                ? styles.small
                : styles.default;

  const baseColor =
    lightColor || darkColor
      ? defaultColor
      : type === 'link'
        ? primaryColor
        : type === 'caption' || type === 'small'
          ? mutedColor
          : defaultColor;

  const callerFlat = style ? StyleSheet.flatten(style) : undefined;
  const resolvedFontSize = callerFlat?.fontSize ?? typeStyle.fontSize;
  const minSafeLineHeight = Math.round(resolvedFontSize * 1.38);
  const resolvedLineHeight =
    callerFlat?.lineHeight != null
      ? Math.max(callerFlat.lineHeight, Math.round(resolvedFontSize * 1.28))
      : callerFlat?.fontSize != null
        ? minSafeLineHeight
        : typeStyle.lineHeight;

  return (
    <Text
      style={[
        { color: baseColor },
        typeStyle,
        style,
        { lineHeight: resolvedLineHeight },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins',
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'PoppinsBold',
  },
  title: {
    fontSize: 26,
    lineHeight: 36,
    fontFamily: 'PoppinsBold',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'PoppinsBold',
  },
  link: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'PoppinsBold',
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  small: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins',
  },
});
