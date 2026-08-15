import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";

const API_URL = "https://backend-verify-email.vercel.app";

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
            <Card style={styles.card}>
                <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 24 }}>
                    {step === "send" ? "Quên Mật Khẩu" : "Xác Thực OTP"}
                </ThemedText>

                {step === "send" && (
                    <>
                        <ThemedText style={{ marginBottom: 16, textAlign: 'center' }}>
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
                            style={{ marginTop: 16 }}
                        />
                    </>
                )}

                {step === "verify" && (
                    <>
                        <ThemedText style={{ marginBottom: 16, textAlign: 'center' }}>
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
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 16,
    }
})
