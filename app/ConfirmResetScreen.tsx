import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from "@/theme/Colors";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import bcrypt from "bcryptjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { firestore } from "../firebaseConfig";

export default function ConfirmResetScreen() {
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const router = useRouter();
    const iconColor = useThemeColor({}, 'icon');

    const [email, setEmail] = useState(emailParam ?? "");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <Card style={styles.card}>
                <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 24 }}>Đặt Lại Mật Khẩu</ThemedText>

                <Input
                    label="Email"
                    value={email}
                    placeholder="email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!!emailParam === false} // Disable if passed via param, or keep editable? usually readonly if confirmed
                />

                <View style={{ marginBottom: 16 }}>
                    <ThemedText style={{ marginBottom: 8, fontSize: 14, fontWeight: '500' }}>Mật khẩu mới</ThemedText>
                    <View style={styles.passwordContainer}>
                        <Input
                            style={{ flex: 1, borderWidth: 0, height: '100%', marginBottom: 0 }}
                            containerStyle={{ marginBottom: 0 }}
                            placeholder="Mật khẩu mới"
                            secureTextEntry={!showPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                    {passwordError ? <ThemedText style={{ color: Colors.light.error, fontSize: 12, marginTop: 4 }}>{passwordError}</ThemedText> : null}
                </View>

                <View style={{ marginBottom: 24 }}>
                    <ThemedText style={{ marginBottom: 8, fontSize: 14, fontWeight: '500' }}>Xác nhận mật khẩu</ThemedText>
                    <View style={styles.passwordContainer}>
                        <Input
                            style={{ flex: 1, borderWidth: 0, height: '100%', marginBottom: 0 }}
                            containerStyle={{ marginBottom: 0 }}
                            placeholder="Xác nhận mật khẩu"
                            secureTextEntry={!showConfirmPassword}
                            value={confirm}
                            onChangeText={setConfirm}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                            <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={iconColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Button
                    title="Đổi mật khẩu"
                    onPress={handleConfirm}
                    loading={loading}
                />
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
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        height: 48,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    eyeIcon: {
        padding: 10,
    },
});

