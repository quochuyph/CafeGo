import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/theme/Colors';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
};

export function Input({ label, error, style, containerStyle, ...props }: InputProps) {
    const textColor = useThemeColor({}, 'text');
    const placeholderColor = useThemeColor({}, 'icon'); // Use icon color for placeholder
    const borderColor = useThemeColor({}, 'border');
    const backgroundColor = useThemeColor({}, 'background');
    const errorColor = Colors.light.error;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <ThemedText type="defaultSemiBold" style={styles.label}>{label}</ThemedText>}
            <TextInput
                style={[
                    styles.input,
                    { color: textColor, borderColor: error ? errorColor : borderColor, backgroundColor },
                    style
                ]}
                placeholderTextColor={placeholderColor}
                {...props}
            />
            {error && <ThemedText style={{ color: errorColor, fontSize: 12, marginTop: 4 }}>{error}</ThemedText>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Poppins',
    },
});
