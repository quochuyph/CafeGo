import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
};

export function Input({
    label,
    error,
    style,
    containerStyle,
    isPassword = false,
    secureTextEntry,
    ...props
}: InputProps) {
    const textColor = useThemeColor({}, 'text');
    const placeholderColor = useThemeColor({}, 'muted');
    const borderColor = useThemeColor({}, 'border');
    const backgroundColor = useThemeColor({}, 'inputBackground');
    const iconColor = useThemeColor({}, 'icon');
    const errorColor = useThemeColor({}, 'error');

    const [passwordVisible, setPasswordVisible] = useState(false);
    const shouldMask = isPassword ? !passwordVisible : secureTextEntry;

    return (
        <View style={[styles.container, containerStyle]}>
            {label ? (
                <ThemedText type="defaultSemiBold" style={styles.label}>
                    {label}
                </ThemedText>
            ) : null}
            <View
                style={[
                    styles.inputWrapper,
                    {
                        borderColor: error ? errorColor : borderColor,
                        backgroundColor,
                    },
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        { color: textColor },
                        isPassword && styles.inputWithToggle,
                        style,
                    ]}
                    placeholderTextColor={placeholderColor}
                    secureTextEntry={shouldMask}
                    {...props}
                />
                {isPassword ? (
                    <TouchableOpacity
                        onPress={() => setPasswordVisible((prev) => !prev)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialCommunityIcons
                            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={iconColor}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
            {error ? (
                <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {error}
                </ThemedText>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 50,
        borderWidth: 1.5,
        borderRadius: 12,
    },
    input: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: 'Poppins',
        textAlignVertical: 'center',
    },
    inputWithToggle: {
        paddingRight: 6,
    },
    eyeButton: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 12,
        marginTop: 6,
    },
});
