import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { env } from '@/config/env';

const API_URL = env.api.passwordResetUrl;

export default function RequestResetScreen() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const [step, setStep] = useState<"send" | "verify">("send");
    const [otp, setOtp] = useState("");

    const [cooldown, setCooldown] = useState(0);
    const [status, setStatus] = useState(false)

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
            await axios.post(`${API_URL}/send-otp`, { email });
            Alert.alert("Mã OTP đã được gửi lại vào Email của bạn.");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
            setCooldown(0);
        } finally {
            setLoading(false);
        }
    };


    const handleSend = async () => {
        if (!email) return Alert.alert("Nhập email");
        setLoading(true);

        try {
            await axios.post(`${API_URL}/send-otp`, { email });
            Alert.alert("OTP đã được gửi tới email");
            setStep("verify");
            setCooldown(30);
        } catch (err: any) {
            Alert.alert("Lỗi", err.response?.data?.error || "Gửi OTP thất bại");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/verify-otp`, { email, otp });
            Alert.alert("Xác minh thành công!");
            router.push({
                pathname: "/ConfirmResetScreen",
                params: { email },
            });
            setStatus(true)
        } catch (err: any) {
            Alert.alert("Lỗi", err.response?.data?.error || "Xác minh thất bại");
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
                        <ThemedText type="title" style={styles.titleText}>
                            {step === "send" ? "Quên Mật Khẩu" : "Xác Thực OTP"}
                        </ThemedText>

                        {step === "send" && (
                            <>
                                <ThemedText style={styles.subtitleText}>
                                    Nhập email của bạn để nhận mã xác thực OTP.
                                </ThemedText>
                                <Input
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="example@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <Button
                                    title="Gửi OTP"
                                    onPress={handleSend}
                                    loading={loading}
                                    style={{ marginTop: 8 }}
                                />
                            </>
                        )}

                        {step === "verify" && (
                            <>
                                <ThemedText style={styles.subtitleText}>
                                    Nhập mã OTP đã được gửi tới {email}
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
                                    title="Xác minh"
                                    onPress={verifyOtp}
                                    loading={loading}
                                />
                            </>
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
})
