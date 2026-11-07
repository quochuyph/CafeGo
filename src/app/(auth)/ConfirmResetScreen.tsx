import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import bcrypt from "bcryptjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { firestore } from '@/config/firebase';

export default function ConfirmResetScreen() {
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const router = useRouter();

    const [email, setEmail] = useState(emailParam ?? "");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const [passwordError, setPasswordError] = useState('')

    const handleConfirm = async () => {
        if (!email || !newPassword || !confirm) {
            return Alert.alert("Nhập đủ thông tin");
        }
        if (newPassword !== confirm) {
            return Alert.alert("Mật khẩu không khớp");
        }
        setLoading(true);
        try {
            if (newPassword.length < 6) {
                setPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
                setLoading(false)
                return
            }
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
                where("email", "==", email)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    passwordHash: newHash
                });
                console.log('✅ Mật khẩu đã được đổi');
                Alert.alert('✅ Mật khẩu đã được cập nhật! Vui lòng đăng nhập lại!')
                router.replace('/authscreen')
            } else {
                console.warn("❌ Không tìm thấy dữ liệu cần update trên Firestore");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", err instanceof Error ? err.message : "Xác minh thất bại");
        } finally {
            setLoading(false);
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
                            Đặt Lại Mật Khẩu
                        </ThemedText>

                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="example@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!emailParam}
                        />

                        <Input
                            label="Mật khẩu mới"
                            placeholder="Nhập mật khẩu mới"
                            isPassword
                            value={newPassword}
                            onChangeText={(val) => {
                                setNewPassword(val);
                                if (passwordError) setPasswordError('');
                            }}
                            error={passwordError}
                        />

                        <Input
                            label="Xác nhận mật khẩu"
                            placeholder="Nhập lại mật khẩu mới"
                            isPassword
                            value={confirm}
                            onChangeText={setConfirm}
                            containerStyle={{ marginBottom: 24 }}
                        />

                        <Button
                            title="Đổi mật khẩu"
                            onPress={handleConfirm}
                            loading={loading}
                        />
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
        marginBottom: 20,
    },
});

