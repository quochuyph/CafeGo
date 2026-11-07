import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

type ButtonType = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
    title: string;
    onPress: () => void;
    type?: ButtonType;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle | ViewStyle[];
    icon?: React.ReactNode;
};

export function Button({
    title,
    onPress,
    type = 'primary',
    loading = false,
    disabled = false,
    style,
    icon,
}: ButtonProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const primaryColor = useThemeColor({}, 'primary');
    const secondaryColor = useThemeColor({}, 'secondary');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const errorColor = useThemeColor({}, 'error');

    const getBackgroundColor = () => {
        if (disabled) {
            if (type === 'outline' || type === 'ghost') return 'transparent';
            return isDark ? '#3A302B' : '#D6CCC4';
        }
        switch (type) {
            case 'primary': return primaryColor;
            case 'secondary': return secondaryColor;
            case 'danger': return errorColor;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return primaryColor;
        }
    };

    const getTextColor = () => {
        if (disabled) {
            if (type === 'outline' || type === 'ghost') return mutedColor;
            return isDark ? '#8C7B6E' : '#FFFFFF';
        }
        switch (type) {
            case 'primary': return '#FFFFFF';
            case 'secondary': return textColor;
            case 'danger': return '#FFFFFF';
            case 'outline': return primaryColor;
            case 'ghost': return primaryColor;
            default: return '#FFFFFF';
        }
    };

    const getBorder = () => {
        if (type === 'outline') {
            return { borderWidth: 1.5, borderColor: disabled ? borderColor : primaryColor };
        }
        if (type === 'secondary') {
            return { borderWidth: 1, borderColor };
        }
        return {};
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                getBorder(),
                style,
                (disabled || loading) && styles.disabled,
            ]}
            onPress={disabled || loading ? undefined : onPress}
            activeOpacity={disabled || loading ? 1 : 0.8}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <ThemedText
                        style={[styles.text, { color: getTextColor() }, Boolean(icon) && { marginLeft: 8 }]}
                        type="defaultSemiBold"
                    >
                        {title}
                    </ThemedText>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 48,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    text: {
        textAlign: 'center',
        fontSize: 15,
    },
    disabled: {
        opacity: 0.65,
    },
});
