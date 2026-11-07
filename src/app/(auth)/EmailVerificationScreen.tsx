import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { firestore } from '@/config/firebase';
import { env } from '@/config/env';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';

const API_URL = env.api.accountOtpUrl;

export default function EmailVerificationScreen() {
    useOwnerGuard();
    const { uid } = useLocalSearchParams();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"send" | "verify">("send");
    const [cooldown, setCooldown] = useState(0);
    const [status, setStatus] = useState(false)
    const [loading, setLoading] = useState(false);

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

    const sendOtp = async () => {
        if (!email) return Alert.alert("Vui lòng nhập Email");

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return Alert.alert("Email không hợp lệ");
        }

        setLoading(true);
        // Check duplicate email
        try {
            const q = query(collection(firestore, "taikhoan"), where("email", "==", email));
            const snap = await getDocs(q);
            if (!snap.empty) {
                Alert.alert("❌ Email đã được sử dụng ở một tài khoản khác!");
                setLoading(false);
                return;
            }

            await axios.post(`${API_URL}/send-otp`, { uid, email });
            Alert.alert("OTP đã được gửi tới email");
            setStep("verify");
            setCooldown(30)
        } catch (err: any) {
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
        } finally {
            setLoading(false)
        }
    };

    const verifyOtp = async () => {
        if (!otp) return Alert.alert("Vui lòng nhập OTP");
        setLoading(true)
        try {
            const res = await axios.post(`${API_URL}/verify-otp`, { uid, otp });

            console.log("✅ API response:", res.data);

            const q = query(
                collection(firestore, "taikhoan"),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    email: email,
                    emailVerified: true
                });
                await AsyncStorage.setItem('userEmail', email);
                await AsyncStorage.setItem('userEmailVerified', 'true')

                setStatus(true)
                console.log('✅ Đã thêm email');
                Alert.alert("Thông báo", "Xác minh thành công!", [
                    { text: "OK", onPress: () => router.replace('/dashboard') }
                ]);
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

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Card style={styles.card}>
                        <ThemedText type="title" style={styles.titleText}>Xác Thực Email</ThemedText>

                        {step === "send" && (
                            <View>
                                <ThemedText style={styles.subtitleText}>
                                    Liên kết email để bảo mật tài khoản và khôi phục mật khẩu khi cần.
                                </ThemedText>
                                <Input
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholder="example@email.com"
                                />
                                <Button
                                    title="Gửi OTP"
                                    onPress={sendOtp}
                                    loading={loading}
                                    style={{ marginTop: 8 }}
                                />
                            </View>
                        )}

                        {step === "verify" && (
                            <View>
                                <ThemedText style={styles.subtitleText}>
                                    Mã OTP đã gửi đến {email}
                                </ThemedText>
                                <Input
                                    label="Mã OTP"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="numeric"
                                    placeholder="123456"
                                />
                                <Button
                                    title={cooldown > 0 ? `Gửi lại sau ${cooldown}s` : `Gửi lại mã OTP`}
                                    onPress={resendVerification}
                                    disabled={cooldown > 0}
                                    type="ghost"
                                    style={{ marginVertical: 8 }}
                                />
                                <Button
                                    title="Xác minh OTP"
                                    onPress={verifyOtp}
                                    loading={loading}
                                />
                            </View>
                        )}
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 20,
    },
    titleText: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitleText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
    },
});
