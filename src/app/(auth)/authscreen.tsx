import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { firestore } from '@/config/firebase';
import { APP_VERSION } from '@/constants/app';
import { saveUserData } from '@/hooks/auth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemePreference } from '@/theme/ThemePreferenceContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

function FloatingInput({
    label,
    value,
    onChangeText,
    secureTextEntry,
    showToggle,
    onToggle,
    showToggleState,
    error,
    autoCapitalize = 'none',
    keyboardType = 'default',
}: any) {
    const inputBg = useThemeColor({}, 'inputBackground');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'muted');
    const errorColor = useThemeColor({}, 'error');

    return (
        <View style={styles.floatingInputContainer}>
            <View
                style={[
                    styles.floatingInputWrapper,
                    {
                        borderColor: error ? errorColor : borderColor,
                        backgroundColor: inputBg,
                    },
                ]}
            >
                <TextInput
                    style={[styles.floatingInput, { color: textColor }]}
                    placeholder={label}
                    placeholderTextColor={mutedColor}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showToggleState}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                />
                {showToggle ? (
                    <TouchableOpacity
                        style={styles.eyeIconBtn}
                        onPress={onToggle}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialCommunityIcons
                            name={showToggleState ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={mutedColor}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
            {error ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText> : null}
        </View>
    );
}

export default function LoginScreenTest() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark, toggleTheme } = useThemePreference();

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const secondaryColor = useThemeColor({}, 'secondary');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');

    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        const autoLogin = async () => {
            const savedUserId = await AsyncStorage.getItem('userId');
            if (savedUserId) {
                router.replace('/dashboard');
            }
        };
        autoLogin();
    }, []);

    const handleRegister = async () => {
        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');

        if (!username || !password || !confirmPassword) {
            Alert.alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Mật khẩu không khớp');
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(firestore, 'taikhoan'), where('username', '==', username));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setUsernameError('Username đã tồn tại');
                setLoading(false);
                return;
            }

            bcrypt.setRandomFallback((len) => {
                const randomBytes = [];
                for (let i = 0; i < len; i++) {
                    randomBytes.push(Math.floor(Math.random() * 256));
                }
                return randomBytes;
            });

            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            const userId = 'U_' + uuidv4();

            await addDoc(collection(firestore, 'taikhoan'), {
                userId,
                displayName,
                username,
                passwordHash: hash,
                emailVerified: false,
                email: null,
                createdAt: new Date(),
            });

            Alert.alert('Đăng ký thành công', 'Bây giờ bạn có thể đăng nhập');
            setIsLogin(true);
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setDisplayName('');
        } catch (err: any) {
            Alert.alert('Lỗi', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setUsernameError('');
        setPasswordError('');

        if (!username || !password) {
            Alert.alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        setLoading(true);
        try {
            const q = query(collection(firestore, 'taikhoan'), where('username', '==', username));
            const snap = await getDocs(q);
            if (snap.empty) {
                setUsernameError('Tài khoản không tồn tại');
                setLoading(false);
                return;
            }

            const userData = snap.docs[0].data();
            const isMatch = bcrypt.compareSync(password, userData.passwordHash);
            if (!isMatch) {
                setPasswordError('Sai mật khẩu');
                setLoading(false);
                return;
            }

            await saveUserData(
                userData.userId,
                username,
                userData.displayName,
                password,
                userData.email,
                JSON.stringify(userData.emailVerified),
            );
            router.replace('/dashboard');
        } catch (err: any) {
            Alert.alert('Lỗi đăng nhập', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = () => {
        if (isLogin) handleLogin();
        else handleRegister();
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Banner */}
                    <View
                        style={[
                            styles.headerBanner,
                            {
                                backgroundColor: primaryColor,
                                paddingTop: insets.top + 16,
                            },
                        ]}
                    >
                        <View style={styles.headerTopRow}>
                            <TouchableOpacity
                                onPress={toggleTheme}
                                style={styles.themeIconBtn}
                                activeOpacity={0.8}
                                accessibilityLabel="Chuyển đổi giao diện sáng tối"
                            >
                                <MaterialCommunityIcons
                                    name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
                                    size={20}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.brandContainer}>
                            <View style={styles.logoCircle}>
                                <ThemedText style={styles.logoEmoji}>☕</ThemedText>
                            </View>
                            <ThemedText style={styles.brandName}>CaféGo</ThemedText>
                            <ThemedText style={styles.brandTagline}>
                                Quản lý quán café thông minh
                            </ThemedText>
                        </View>
                    </View>

                    {/* Auth Card */}
                    <View style={styles.cardOuter}>
                        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                            {/* Tab switcher */}
                            <View style={[styles.tabContainer, { backgroundColor: secondaryColor }]}>
                                <TouchableOpacity
                                    style={[styles.tab, isLogin && { backgroundColor: primaryColor }]}
                                    onPress={() => {
                                        setIsLogin(true);
                                        setPasswordError('');
                                        setUsernameError('');
                                        setConfirmPasswordError('');
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <ThemedText
                                        numberOfLines={1}
                                        style={[
                                            styles.tabText,
                                            { color: isLogin ? '#FFFFFF' : mutedColor },
                                        ]}
                                    >
                                        Đăng Nhập
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, !isLogin && { backgroundColor: primaryColor }]}
                                    onPress={() => {
                                        setIsLogin(false);
                                        setPasswordError('');
                                        setUsernameError('');
                                        setConfirmPasswordError('');
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <ThemedText
                                        numberOfLines={1}
                                        style={[
                                            styles.tabText,
                                            { color: !isLogin ? '#FFFFFF' : mutedColor },
                                        ]}
                                    >
                                        Đăng Ký
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formContainer}>
                                <FloatingInput
                                    label="Username"
                                    value={username}
                                    onChangeText={setUsername}
                                    error={usernameError}
                                    autoCapitalize="none"
                                />

                                {!isLogin ? (
                                    <FloatingInput
                                        label="Tên hiển thị"
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        autoCapitalize="words"
                                    />
                                ) : null}

                                <FloatingInput
                                    label="Mật khẩu"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    showToggle
                                    showToggleState={showPassword}
                                    onToggle={() => setShowPassword(!showPassword)}
                                    error={passwordError}
                                />

                                {!isLogin ? (
                                    <FloatingInput
                                        label="Xác nhận mật khẩu"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        showToggle
                                        showToggleState={showConfirmPassword}
                                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                        error={confirmPasswordError}
                                    />
                                ) : null}

                                <Button
                                    title={isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                                    onPress={handleAuth}
                                    loading={loading}
                                    style={styles.authButton}
                                />

                                {isLogin ? (
                                    <TouchableOpacity
                                        onPress={() => router.push('/RequestResetScreen')}
                                        style={styles.forgotPassword}
                                    >
                                        <ThemedText style={[styles.forgotText, { color: primaryColor }]}>
                                            Quên mật khẩu?
                                        </ThemedText>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        <ThemedText style={[styles.footer, { color: mutedColor }]}>
                            CaféGo v{APP_VERSION} • Coded by Quoc Huy
                        </ThemedText>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 32,
    },
    headerBanner: {
        paddingHorizontal: 24,
        paddingBottom: 56,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    themeIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    brandContainer: {
        alignItems: 'center',
        marginTop: 4,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    logoEmoji: {
        fontSize: 32,
    },
    brandName: {
        fontSize: 28,
        fontFamily: 'PoppinsBold',
        color: '#FFFFFF',
        letterSpacing: 0.4,
    },
    brandTagline: {
        fontSize: 13,
        fontFamily: 'Poppins',
        color: 'rgba(255, 255, 255, 0.88)',
        marginTop: 2,
    },
    cardOuter: {
        paddingHorizontal: 20,
        marginTop: -32,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden',
    },
    tabContainer: {
        flexDirection: 'row',
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontFamily: 'PoppinsBold',
        fontSize: 14,
        textAlign: 'center',
    },
    formContainer: {
        padding: 20,
        paddingTop: 18,
    },
    floatingInputContainer: {
        marginBottom: 14,
    },
    floatingInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        borderWidth: 1.5,
        borderRadius: 12,
    },
    floatingInput: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        fontFamily: 'Poppins',
        textAlignVertical: 'center',
    },
    eyeIconBtn: {
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 4,
        fontFamily: 'Poppins',
    },
    authButton: {
        marginTop: 8,
        minHeight: 52,
        borderRadius: 12,
    },
    forgotPassword: {
        alignSelf: 'center',
        marginTop: 16,
        paddingVertical: 4,
    },
    forgotText: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
        fontFamily: 'Poppins',
    },
});
