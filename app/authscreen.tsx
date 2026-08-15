import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { saveUserData } from '@/hooks/auth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/theme/Colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from "bcryptjs";
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
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
import { v4 as uuidv4 } from "uuid";
import appConfig from '../app.json';
import { firestore } from '../firebaseConfig.js';

export default function LoginScreenTest() {
    const router = useRouter();
    const primaryColor = useThemeColor({}, 'primary');
    const bgColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
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
            const savedUserId = await AsyncStorage.getItem("userId");
            if (savedUserId) {
                router.replace("/dashboard");
            }
        };
        autoLogin();
    }, []);

    const handleRegister = async () => {
        setUsernameError('');
        setPasswordError('');
        setConfirmPasswordError('');

        if (!username || !password || !confirmPassword) {
            Alert.alert("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError("Mật khẩu không khớp");
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(firestore, "taikhoan"), where("username", "==", username));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setUsernameError("Username đã tồn tại");
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
            const userId = "U_" + uuidv4();

            await addDoc(collection(firestore, "taikhoan"), {
                userId, displayName, username, passwordHash: hash,
                emailVerified: false, email: null, createdAt: new Date()
            });

            Alert.alert("Đăng ký thành công", "Bây giờ bạn có thể đăng nhập");
            setIsLogin(true);
        } catch (error) {
            Alert.alert("Có lỗi không xác định! Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setPasswordError('');
        setUsernameError('');

        if (!username || !password) {
            setPasswordError("Vui lòng nhập username và mật khẩu");
            setLoading(false);
            return;
        }

        try {
            const q = query(collection(firestore, "taikhoan"), where("username", "==", username));
            const snap = await getDocs(q);

            if (snap.empty) {
                setUsernameError("Tài khoản không tồn tại");
                setLoading(false);
                return;
            }

            const userData = snap.docs[0].data();
            const isMatch = bcrypt.compareSync(password, userData.passwordHash);

            if (!isMatch) {
                setPasswordError("Sai username hoặc mật khẩu");
                setLoading(false);
                return;
            }

            await saveUserData(userData.userId, username, userData.displayName, password, userData.email, JSON.stringify(userData.emailVerified));
            router.replace("/dashboard");
        } catch (error) {
            Alert.alert("Có lỗi không xác định! Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = () => {
        if (isLogin) handleLogin();
        else handleRegister();
    };

    const FloatingInput = ({
        label, value, onChangeText, placeholder, secureTextEntry, showToggle, onToggle, showToggleState, error, autoCapitalize = 'none', keyboardType = 'default'
    }: any) => (
        <View style={styles.floatingInputContainer}>
            <TextInput
                style={[styles.floatingInput, {
                    color: textColor,
                    borderColor: error ? Colors.light.error : borderColor,
                    backgroundColor: bgColor,
                }]}
                placeholder={label}
                placeholderTextColor={mutedColor}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !showToggleState}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboardType}
            />
            {showToggle && (
                <TouchableOpacity style={styles.eyeIconAbsolute} onPress={onToggle}>
                    <MaterialCommunityIcons
                        name={showToggleState ? 'eye-off' : 'eye'}
                        size={20}
                        color={mutedColor}
                    />
                </TouchableOpacity>
            )}
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        </View>
    );

    const appVersion = appConfig?.expo?.version || '8.0.0';

    return (
        <ThemedView style={styles.container}>
            {/* Decorative top wave */}
            <View style={[styles.topDecor, { backgroundColor: primaryColor }]} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand */}
                    <View style={styles.brandContainer}>
                        <View style={styles.logoCircle}>
                            <ThemedText style={styles.logoEmoji}>☕</ThemedText>
                        </View>
                        <ThemedText style={styles.brandName}>CaféGo</ThemedText>
                        <ThemedText style={styles.brandTagline}>
                            Quản lý quán café thông minh
                        </ThemedText>
                    </View>

                    {/* Card */}
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        {/* Tab switcher */}
                        <View style={[styles.tabContainer, { backgroundColor: useThemeColor({}, 'secondary') }]}>
                            <TouchableOpacity
                                style={[styles.tab, isLogin && { backgroundColor: primaryColor }]}
                                onPress={() => { setIsLogin(true); setPasswordError(''); setUsernameError(''); }}
                                activeOpacity={0.8}
                            >
                                <ThemedText
                                    numberOfLines={1}
                                    style={[styles.tabText, isLogin && styles.tabTextActive]}
                                >
                                    Đăng Nhập
                                </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !isLogin && { backgroundColor: primaryColor }]}
                                onPress={() => { setIsLogin(false); setPasswordError(''); setUsernameError(''); }}
                                activeOpacity={0.8}
                            >
                                <ThemedText
                                    numberOfLines={1}
                                    style={[styles.tabText, !isLogin && styles.tabTextActive]}
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

                            {!isLogin && (
                                <FloatingInput
                                    label="Tên hiển thị"
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                />
                            )}

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

                            {!isLogin && (
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
                            )}

                            <Button
                                title={isLogin ? 'Đăng nhập' : 'Đăng ký'}
                                onPress={handleAuth}
                                loading={loading}
                                style={styles.authButton}
                            />

                            {isLogin && (
                                <TouchableOpacity
                                    onPress={() => router.push('/RequestResetScreen')}
                                    style={styles.forgotPassword}
                                >
                                    <ThemedText style={[styles.forgotText, { color: primaryColor }]}>
                                        Quên mật khẩu?
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <ThemedText style={[styles.footer, { color: mutedColor }]}>
                        CaféGo v{appVersion} • Coded by Quoc Huy
                    </ThemedText>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topDecor: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 48,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    logoEmoji: {
        fontSize: 34,
    },
    brandName: {
        fontSize: 30,
        fontFamily: 'PoppinsBold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    brandTagline: {
        fontSize: 13,
        fontFamily: 'Poppins',
        color: 'rgba(255, 255, 255, 0.85)',
        marginTop: 2,
    },
    card: {
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
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
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontFamily: 'PoppinsBold',
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    formContainer: {
        padding: 20,
        paddingTop: 16,
    },
    floatingInputContainer: {
        marginBottom: 16,
    },
    floatingInput: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingRight: 48,
        fontSize: 15,
        fontFamily: 'Poppins',
    },
    eyeIconAbsolute: {
        position: 'absolute',
        right: 14,
        top: 16,
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontFamily: 'Poppins',
    },
    authButton: {
        marginTop: 8,
        height: 52,
        borderRadius: 12,
    },
    forgotPassword: {
        alignSelf: 'center',
        marginTop: 16,
    },
    forgotText: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    footer: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
        fontFamily: 'Poppins',
    },
});
