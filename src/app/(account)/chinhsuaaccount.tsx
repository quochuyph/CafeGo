import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import bcrypt from "bcryptjs";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from 'expo-sqlite';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { auth, firestore } from '@/config/firebase';
import { env } from '@/config/env';

const API_URL = env.api.accountOtpUrl;

const ChinhSuaAccount = () => {
    const { username, password, displayName, email } = useLocalSearchParams();
    const database = useSQLiteContext()
    const iconColor = useThemeColor({}, 'icon');
    const mutedColor = useThemeColor({}, 'muted');
    const borderColor = useThemeColor({}, 'border');

    const [uid, setUid] = useState<string | null>(null);

    const [step, setStep] = useState<"send" | "verified">("send");
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [status, setStatus] = useState(false)

    const [otpVerifyEmail, setOtpVerifyEmail] = useState('')
    const [stepVerifyEmail, setStepVerifyEmail] = useState<'send' | 'verify'>('send')

    const [loading, setLoading] = useState(true);

    const [newUsername, setNewUsername] = useState('')
    const [newDisplayName, setNewDisplayName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newConfirmedPassword, setNewConfirmedPassword] = useState('')

    const [isShowingEditUsername, setIsShowingEditUsername] = useState(false)
    const [isShowingEditEmail, setIsShowingEditEmail] = useState(false)
    const [isShowingEditDisplayName, setIsShowingEditDisplayName] = useState(false)
    const [isShowingEditPassword, setIsShowingEditPassword] = useState(false)

    const [isShowingPassword, setIsShowingPassword] = useState(false)

    const [usernameError, setUsernameError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [displayNameError, setDisplayNameError] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const isValidUsername = (name: string) => /^[a-z0-9]+$/.test(name)

    useEffect(() => {
        const loadUid = async () => {
            try {
                const storedUid = await AsyncStorage.getItem("userId");
                if (storedUid) {
                    setUid(storedUid);
                } else if (storedUid === null) {
                    router.replace('/');
                }
            } catch (error) {
                console.error("Lỗi lấy uid:", error);
            } finally {
                setLoading(false);
            }
        };

        const loadStep = async () => {
            const step = await AsyncStorage.getItem("step");
            const expireAtStr = await AsyncStorage.getItem("stepExpireAt");

            if (step === "verified" && expireAtStr) {
                const expireAt = parseInt(expireAtStr, 10);
                const now = Date.now();

                if (now >= expireAt) {
                    // Hết hạn → reset về send
                    await AsyncStorage.setItem("step", "send");
                    await AsyncStorage.removeItem("stepExpireAt");
                    return "send";
                }
            }
            return step || "send";
        };

        const sendOtp = async () => {
            setLoading(true);
            const uid = await AsyncStorage.getItem("userId");
            try {
                await axios.post(`${API_URL}/send-otp`, { uid, email });
                Alert.alert("Mã xác minh đã được gửi đến Email của bạn. Trạng thái Xác minh sẽ giữ trong 15 phút.");
                setStep("send");
                setCooldown(30)
            } catch (err: any) {
                Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
            } finally {
                setLoading(false)
            }
        };

        loadUid();
        loadStep().then((value) => {
            if (value === "verified") {
                setStep(value)
            } else if (value === 'send') {
                sendOtp()
            } else {
                setStep("send")
            }
        })
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);


    const resendVerification = async () => {
        if (status) {
            Alert.alert("Email đã được xác minh!");
            return;
        }

        setCooldown(30); // ⬅ Bắt đầu countdown NGAY LẬP TỨC
        setLoading(true);

        try {
            await axios.post(`${API_URL}/send-otp`, { uid, email });
            Alert.alert("Mã OTP đã được gửi lại vào Email của bạn.");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
            setCooldown(0);
        } finally {
            setLoading(false);
        }
    };

    const resendVerificationNewEmail = async (newEmail: string) => {
        if (status) {
            Alert.alert("Email đã được xác minh!");
            return;
        }

        setCooldown(30); // ⬅ Bắt đầu countdown NGAY LẬP TỨC
        setLoading(true);

        try {
            await axios.post(`${API_URL}/send-otp`, { uid, email: newEmail });
            Alert.alert("Mã OTP đã được gửi lại vào Email của bạn.");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
            setCooldown(0);
        } finally {
            setLoading(false);
        }
    };

    const startVerifiedStep = async () => {
        const now = Date.now();
        const expireAt = now + 15 * 60 * 1000; // 15 phút sau
        await AsyncStorage.setItem("step", "verified");
        await AsyncStorage.setItem("stepExpireAt", expireAt.toString());
    };

    const verifyOtp = async () => {
        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/verify-otp`, { uid, otp });

            console.log("✅ API response:", res.data);
            startVerifiedStep()
            setStatus(true)
            router.replace({
                pathname: "/chinhsuaaccount",
                params: { username: username, password: password, displayName: displayName, email: email }
            })
        } catch (err) {
            console.log(err)
            Alert.alert("Xác minh thất bại");
        } finally {
            setLoading(false)
        }
    };

    const verifyOtpNewEmail = async (newEmail: string) => {
        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/verify-otp`, { uid, otp: otpVerifyEmail });

            console.log("✅ API response:", res.data);
            setStatus(true)

            const q = query(
                collection(firestore, "taikhoan"),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    email: newEmail
                });
                console.log('✅ Email đã được đổi');
                Alert.alert('✅ Email đã được cập nhật!')
                await AsyncStorage.setItem('userEmail', newEmail);
                router.replace({
                    pathname: "/chinhsuaaccount",
                    params: { username: username, password: password, displayName: displayName, email: newEmail }
                })
            } else {
                console.warn("❌ Không tìm thấy dữ liệu cần update trên Firestore");
            }
        } catch (err) {
            console.log(err)
            Alert.alert("Xác minh thất bại");
        } finally {
            setLoading(false)
        }
    };

    const changeUsername = async (newUsername: string) => {
        if (uid) {
            setLoading(true)
            const q = query(collection(firestore, "taikhoan"), where("username", "==", newUsername));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setUsernameError('Username đã tồn tại')
                setLoading(false);
                return;
            }
            if (!isValidUsername(newUsername)) {
                setUsernameError("Tên người dùng chỉ được gồm chữ thường và số, không dấu, không cách, không ký tự đặc biệt.")
                setLoading(false);
                return
            }
            if (newUsername == (username ?? '').toString()) {
                Alert.alert('Username mới không được trùng với username cũ')
                setLoading(false)
                return
            }
            try {
                Alert.alert('Thông Báo!', 'Bạn có chắc chắn muốn đổi Username?', [
                    {
                        text: 'Hủy',
                        style: 'cancel'
                    },
                    {
                        text: 'Đổi Username', onPress: async () => {
                            const q = query(
                                collection(firestore, "taikhoan"),
                                where("userId", "==", uid)
                            );

                            const querySnapshot = await getDocs(q);
                            console.log()
                            if (!querySnapshot.empty) {
                                const docRef = querySnapshot.docs[0].ref;
                                await updateDoc(docRef, {
                                    username: newUsername
                                });
                                console.log('✅ Username đã được đổi');
                                Alert.alert('✅ Username đã được cập nhật! Vui lòng đăng nhập lại!')
                                handleLogout()
                            } else {
                                console.warn("❌ Không tìm thấy dữ liệu cần update trên Firestore");
                            }
                        }
                    }
                ])
            } catch (error) {
                console.error('❌ Lỗi khi đổi Username:', error);
            } finally {
                setLoading(false)
            }
        }
    };

    const changeDisplayName = async (newDisplayName: string) => {
        if (uid) {
            setLoading(true)
            if (newDisplayName == (displayName ?? '').toString()) {
                setDisplayNameError('Tên mới đã trùng với tên cũ!')
                setLoading(false)
                return
            }
            try {
                Alert.alert('Thông Báo!', 'Bạn có chắc chắn muốn đổi Tên hiển thị?', [
                    {
                        text: 'Hủy',
                        style: 'cancel'
                    },
                    {
                        text: 'Đổi Tên', onPress: async () => {
                            const q = query(
                                collection(firestore, "taikhoan"),
                                where("userId", "==", uid)
                            );

                            const querySnapshot = await getDocs(q);
                            console.log()
                            if (!querySnapshot.empty) {
                                const docRef = querySnapshot.docs[0].ref;
                                await updateDoc(docRef, {
                                    displayName: newDisplayName
                                });
                                console.log('✅ displayName đã được đổi');
                                Alert.alert('✅ Tên đã được cập nhật!')
                                await AsyncStorage.setItem('displayName', newDisplayName);
                                router.back()
                            } else {
                                console.warn("❌ Không tìm thấy dữ liệu cần update trên Firestore");
                            }
                        }
                    }
                ])
            } catch (error) {
                console.error('❌ Lỗi khi đổi displayName:', error);
            } finally {
                setLoading(false)
            }
        }
    };

    const changeEmail = async (newEmail: string) => {
        if (uid) {
            setLoading(true);
            const q = query(collection(firestore, "taikhoan"), where("email", "==", newEmail));
            const snap = await getDocs(q);
            if (newEmail === (email ?? '').toString()) {
                setDisplayNameError('Email mới đã trùng với Email cũ!')
                setLoading(false)
                return
            }
            if (!snap.empty) {
                Alert.alert("❌ Email đã được sử dụng cho tài khoản khác");
                setLoading(false);
                return;
            }
            try {
                await axios.post(`${API_URL}/send-otp`, { uid, email: newEmail });
                Alert.alert("Mã xác minh đã được gửi đến Email mới của bạn.");
                setStepVerifyEmail("verify");
                setCooldown(30)
            } catch (err: any) {
                Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
    };

    const changePassword = async (newPassword: string, newConfirmedPassword: string) => {
        if (uid) {
            setLoading(true)
            if (newPassword !== newConfirmedPassword) {
                setPasswordError('Mật khẩu không trùng khớp')
                setLoading(false)
                return
            }
            if (newPassword.length < 6) {
                setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
                setLoading(false)
                return
            }
            if (newPassword == (password ?? '').toString()) {
                setPasswordError('Mật khẩu mới không được trùng với mật khẩu cũ')
                setLoading(false)
                return
            }
            try {
                Alert.alert('Thông Báo!', 'Bạn có chắc chắn muốn đổi Mật khẩu không?', [
                    {
                        text: 'Hủy',
                        style: 'cancel'
                    },
                    {
                        text: 'Đổi Mật khẩu', onPress: async () => {
                            bcrypt.setRandomFallback((len) => {
                                const randomBytes = [];
                                for (let i = 0; i < len; i++) {
                                    randomBytes.push(Math.floor(Math.random() * 256));
                                }
                                return randomBytes;
                            });

                            const salt = bcrypt.genSaltSync(10);
                            const newHash = bcrypt.hashSync(newPassword, salt);

                            const q = query(
                                collection(firestore, "taikhoan"),
                                where("userId", "==", uid)
                            );

                            const querySnapshot = await getDocs(q);
                            if (!querySnapshot.empty) {
                                const docRef = querySnapshot.docs[0].ref;
                                await updateDoc(docRef, {
                                    passwordHash: newHash
                                });
                                console.log('✅ Mật khẩu đã được đổi');
                                Alert.alert('✅ Password đã được cập nhật! Vui lòng đăng nhập lại!')
                                handleLogout()
                            } else {
                                console.warn("❌ Không tìm thấy dữ liệu cần update trên Firestore");
                            }
                        }
                    }
                ])
            } catch (error) {
                console.error('❌ Lỗi khi đổi mật khẩu:', error);
            } finally {
                setLoading(false)
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);

            await database.runAsync("DELETE FROM ban WHERE userId = ?;", [String(uid)])
            await database.runAsync("DELETE FROM chitiethd WHERE userId = ?;", [String(uid)])
            await database.runAsync("DELETE FROM hoadon WHERE userId = ?;", [String(uid)])
            await database.runAsync("DELETE FROM nhommon WHERE userId = ?;", [String(uid)])
            await database.runAsync("DELETE FROM menu WHERE userId = ?;", [String(uid)])

            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('username');
            await AsyncStorage.removeItem('displayName');
            await AsyncStorage.removeItem('userPassword');
            await AsyncStorage.removeItem('userEmail');
            await AsyncStorage.removeItem('userEmailVerified');

            setIsShowingEditUsername(false);
            setIsShowingEditDisplayName(false);
            setIsShowingEditEmail(false)
            setIsShowingEditPassword(false);

            setIsShowingPassword(false);

            setNewUsername('')
            setNewDisplayName('')
            setNewEmail('')
            setNewPassword('')
            setNewConfirmedPassword('')

            console.log('✅ Đăng xuất thành công');

            router.replace('/')

        } catch (error) {
            console.error('❌ Lỗi khi đăng xuất:', error);
        }
    };

    const handleCancel = () => {
        setIsShowingEditUsername(false);
        setIsShowingEditDisplayName(false);
        setIsShowingEditEmail(false)
        setIsShowingEditPassword(false);

        setIsShowingPassword(false);

        setNewUsername('')
        setNewDisplayName('')
        setNewEmail('')
        setNewPassword('')
        setNewConfirmedPassword('')

        setUsernameError('')
        setDisplayNameError('')
        setEmailError('')
        setPasswordError('')
    }

    const handleBack = () => {
        setIsShowingEditUsername(false);
        setIsShowingEditDisplayName(false);
        setIsShowingEditEmail(false)
        setIsShowingEditPassword(false);

        setIsShowingPassword(false);

        setNewUsername('')
        setNewDisplayName('')
        setNewEmail('')
        setNewPassword('')
        setNewConfirmedPassword('')

        setUsernameError('')
        setDisplayNameError('')
        setEmailError('')
        setPasswordError('')

        router.back()
    }

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    if (uid === null) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText>Không có UID, vui lòng đăng nhập</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

                {step === 'send' && (
                    <ScrollView
                        contentContainerStyle={styles.otpScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Card style={styles.otpCard}>
                            <ThemedText type="subtitle" style={{ marginBottom: 8, textAlign: 'center' }}>
                                Xác Minh Danh Tính
                            </ThemedText>
                            <ThemedText style={{ color: mutedColor, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                                Vui lòng nhập mã OTP đã gửi đến email của bạn để tiếp tục chỉnh sửa tài khoản.
                            </ThemedText>
                            <Input
                                label="Nhập OTP"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="numeric"
                                placeholder="Nhập mã OTP đã nhận"
                            />
                            <View style={{ gap: 12, marginTop: 8 }}>
                                <Button
                                    onPress={resendVerification}
                                    disabled={cooldown > 0}
                                    title={cooldown > 0 ? `Gửi lại sau ${cooldown}s` : `Gửi lại email xác minh`}
                                    type="secondary"
                                />
                                <Button
                                    onPress={verifyOtp}
                                    loading={loading}
                                    title="Xác minh OTP"
                                />
                            </View>
                        </Card>
                    </ScrollView>
                )}

                {step === 'verified' && (
                    <ScrollView
                        contentContainerStyle={styles.verifiedScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <ThemedText type="title" style={styles.headerTitle}>Chỉnh sửa tài khoản</ThemedText>

                        {/* Username Section */}
                        <Card style={styles.sectionContainer}>
                            <View style={{ marginBottom: 12 }}>
                                <ThemedText style={[styles.label, { color: mutedColor }]}>Username hiện tại</ThemedText>
                                <ThemedText type="defaultSemiBold">{username}</ThemedText>
                            </View>

                            {!isShowingEditUsername ? (
                                <Button
                                    title="Chỉnh sửa Username"
                                    onPress={() => { setIsShowingEditUsername(true); setIsShowingEditPassword(false); setIsShowingEditDisplayName(false); setIsShowingEditEmail(false) }}
                                    type="secondary"
                                    style={styles.responsiveButton}
                                />
                            ) : (
                                <Button
                                    title="Hủy"
                                    onPress={handleCancel}
                                    type="outline"
                                    style={styles.responsiveButton}
                                />
                            )}

                            {isShowingEditUsername && (
                                <View style={[styles.editForm, { borderTopColor: borderColor }]}>
                                    <Input
                                        label="Username mới"
                                        placeholder="Nhập Username mới"
                                        value={newUsername}
                                        onChangeText={setNewUsername}
                                        autoCapitalize="none"
                                        error={usernameError}
                                    />
                                    <Button title="Xác Nhận" onPress={() => changeUsername(newUsername)} />
                                </View>
                            )}
                        </Card>

                        {/* Display Name Section */}
                        <Card style={styles.sectionContainer}>
                            <View style={{ marginBottom: 12 }}>
                                <ThemedText style={[styles.label, { color: mutedColor }]}>Tên hiển thị hiện tại</ThemedText>
                                <ThemedText type="defaultSemiBold">{displayName}</ThemedText>
                            </View>

                            {!isShowingEditDisplayName ? (
                                <Button
                                    title="Chỉnh sửa Tên hiển thị"
                                    onPress={() => { setIsShowingEditDisplayName(true); setIsShowingEditPassword(false); setIsShowingEditUsername(false); setIsShowingEditEmail(false) }}
                                    type="secondary"
                                    style={styles.responsiveButton}
                                />
                            ) : (
                                <Button
                                    title="Hủy"
                                    onPress={handleCancel}
                                    type="outline"
                                    style={styles.responsiveButton}
                                />
                            )}

                            {isShowingEditDisplayName && (
                                <View style={[styles.editForm, { borderTopColor: borderColor }]}>
                                    <Input
                                        label="Tên hiển thị mới"
                                        placeholder="Nhập Tên hiển thị mới"
                                        value={newDisplayName}
                                        onChangeText={setNewDisplayName}
                                        autoCapitalize="none"
                                        error={displayNameError}
                                    />
                                    <Button title="Xác Nhận" onPress={() => changeDisplayName(newDisplayName)} />
                                </View>
                            )}
                        </Card>

                        {/* Email Section */}
                        <Card style={styles.sectionContainer}>
                            <View style={{ marginBottom: 12 }}>
                                <ThemedText style={[styles.label, { color: mutedColor }]}>Email hiện tại</ThemedText>
                                <ThemedText type="defaultSemiBold">{email}</ThemedText>
                            </View>

                            {!isShowingEditEmail ? (
                                <Button
                                    title="Chỉnh sửa Email"
                                    onPress={() => { setIsShowingEditEmail(true); setIsShowingEditPassword(false); setIsShowingEditUsername(false); setIsShowingEditDisplayName(false) }}
                                    type="secondary"
                                    style={styles.responsiveButton}
                                />
                            ) : (
                                <Button
                                    title="Hủy"
                                    onPress={handleCancel}
                                    type="outline"
                                    style={styles.responsiveButton}
                                />
                            )}

                            {isShowingEditEmail && (
                                <View style={[styles.editForm, { borderTopColor: borderColor }]}>
                                    <Input
                                        label="Email mới"
                                        placeholder="Nhập Email mới"
                                        value={newEmail}
                                        onChangeText={setNewEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        error={emailError}
                                    />
                                    {stepVerifyEmail === 'send' && (
                                        <Button title="Xác Nhận" onPress={() => changeEmail(newEmail)} />
                                    )}
                                </View>
                            )}

                            {stepVerifyEmail === 'verify' && (
                                <View style={[styles.editForm, { borderTopColor: borderColor }]}>
                                    <Input
                                        label="Nhập OTP"
                                        value={otpVerifyEmail}
                                        onChangeText={setOtpVerifyEmail}
                                        keyboardType="numeric"
                                    />
                                    <View style={{ gap: 12, marginTop: 8 }}>
                                        <Button
                                            onPress={() => resendVerificationNewEmail(newEmail)}
                                            disabled={cooldown > 0}
                                            title={cooldown > 0 ? `Gửi lại sau ${cooldown}s` : `Gửi lại email xác minh`}
                                            type="secondary"
                                        />
                                        <Button
                                            onPress={() => verifyOtpNewEmail(newEmail)}
                                            loading={loading}
                                            title="Xác minh OTP"
                                        />
                                    </View>
                                </View>
                            )}
                        </Card>

                        {/* Password Section */}
                        <Card style={styles.sectionContainer}>
                            <View style={{ marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, marginRight: 12 }}>
                                    <ThemedText style={[styles.label, { color: mutedColor }]}>Mật khẩu hiện tại</ThemedText>
                                    <ThemedText type="defaultSemiBold">{isShowingPassword ? password : '••••••••'}</ThemedText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsShowingPassword(!isShowingPassword)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialCommunityIcons name={isShowingPassword ? "eye-off" : "eye"} size={22} color={iconColor} />
                                </TouchableOpacity>
                            </View>

                            {!isShowingEditPassword ? (
                                <Button
                                    title="Chỉnh sửa Mật khẩu"
                                    onPress={() => { setIsShowingEditPassword(true); setIsShowingEditUsername(false); setIsShowingEditDisplayName(false); setIsShowingEditEmail(false) }}
                                    type="secondary"
                                    style={styles.responsiveButton}
                                />
                            ) : (
                                <Button
                                    title="Hủy"
                                    onPress={handleCancel}
                                    type="outline"
                                    style={styles.responsiveButton}
                                />
                            )}

                            {isShowingEditPassword && (
                                <View style={[styles.editForm, { borderTopColor: borderColor }]}>
                                    <Input
                                        label="Mật khẩu mới"
                                        placeholder="Nhập Mật khẩu mới"
                                        isPassword
                                        value={newPassword}
                                        onChangeText={(val) => {
                                            setNewPassword(val);
                                            if (passwordError) setPasswordError('');
                                        }}
                                    />

                                    <Input
                                        label="Xác nhận Mật khẩu mới"
                                        placeholder="Xác nhận Mật khẩu mới"
                                        isPassword
                                        value={newConfirmedPassword}
                                        onChangeText={(val) => {
                                            setNewConfirmedPassword(val);
                                            if (passwordError) setPasswordError('');
                                        }}
                                        error={passwordError}
                                    />

                                    <Button
                                        title="Xác Nhận"
                                        onPress={() => changePassword(newPassword, newConfirmedPassword)}
                                        loading={loading}
                                    />
                                </View>
                            )}
                        </Card>

                        <Button
                            title="Quay lại"
                            onPress={handleBack}
                            type="ghost"
                            style={{ marginTop: 10, marginBottom: 40 }}
                        />
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </ThemedView>
    )
}

export default ChinhSuaAccount;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    otpScrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    otpCard: {
        padding: 24,
        borderRadius: 20,
    },
    verifiedScrollContent: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
    },
    sectionContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        marginBottom: 4,
    },
    responsiveButton: {
        alignSelf: 'flex-start',
    },
    editForm: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
});
