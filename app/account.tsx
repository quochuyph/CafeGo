import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/theme/Colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from 'expo-sqlite';
import { signOut } from 'firebase/auth';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig.js';

const Account = () => {
    const database = useSQLiteContext()
    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const iconColor = useThemeColor({}, 'icon');

    const [isShowingPassword, setIsShowingPassword] = useState(false)

    const [uid, setUid] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const storedUid = await AsyncStorage.getItem("userId");
            const storedEmail = await AsyncStorage.getItem('userEmail');
            const storedVerified = await AsyncStorage.getItem('userEmailVerified');
            const storedUsername = await AsyncStorage.getItem('username');
            const storedDisplayName = await AsyncStorage.getItem('displayName');
            const storedPassword = await AsyncStorage.getItem('userPassword');

            setUid(storedUid);
            setEmail(storedEmail);
            setEmailVerified(storedVerified ? JSON.parse(storedVerified) : false);
            setUsername(storedUsername);
            setDisplayName(storedDisplayName);
            setPassword(storedPassword);

            if (storedUid === null) {
                router.replace('/');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    const handleLogout = async () => {
        try {
            Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản?', [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut(auth);

                        if (uid) {
                            try {
                                await database.runAsync("DELETE FROM ban WHERE userId = ?;", [String(uid)])
                                await database.runAsync("DELETE FROM chitiethd WHERE userId = ?;", [String(uid)])
                                await database.runAsync("DELETE FROM hoadon WHERE userId = ?;", [String(uid)])
                                await database.runAsync("DELETE FROM nhommon WHERE userId = ?;", [String(uid)])
                                await database.runAsync("DELETE FROM menu WHERE userId = ?;", [String(uid)])
                            } catch (error) {
                                console.log("Error clearing DB:", error);
                            }
                        }

                        await AsyncStorage.multiRemove([
                            'userId', 'username', 'displayName', 'userPassword',
                            'userEmail', 'userEmailVerified', 'step', 'stepExpireAt'
                        ]);

                        router.replace('/')
                    }
                }
            ])
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    if (loading) {
        return (
            <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText>Đang tải...</ThemedText>
            </ThemedView>
        );
    }

    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U');

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View style={styles.headerSection}>
                    <View style={[styles.avatarCircle, { backgroundColor: primaryColor }]}>
                        <ThemedText style={styles.avatarText}>{firstLetter}</ThemedText>
                    </View>
                    <ThemedText type="title" style={styles.displayName}>{displayName || 'Người dùng'}</ThemedText>
                    <ThemedText style={[styles.username, { color: mutedColor }]}>@{username}</ThemedText>
                </View>

                {/* Info Card */}
                <Card variant="elevated" style={[styles.infoCard, { backgroundColor: cardColor, borderColor }]}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="account-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Tên hiển thị</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.value}>{displayName}</ThemedText>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="identifier" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Username</ThemedText>
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.value}>{username}</ThemedText>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="email-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Email</ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end', flex: 1 }}>
                            {email ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <ThemedText style={[styles.value, { fontSize: 13 }]} numberOfLines={1}>{email}</ThemedText>
                                    {emailVerified ? (
                                        <MaterialIcons name="verified" size={16} color="#27AE60" />
                                    ) : null}
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => router.push({ pathname: '/EmailVerificationScreen', params: { uid: uid } })}>
                                    <ThemedText style={{ color: primaryColor, fontFamily: 'PoppinsBold', fontSize: 13 }}>+ Thêm Email</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: borderColor }]} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <MaterialCommunityIcons name="lock-outline" size={22} color={primaryColor} />
                            <ThemedText style={styles.label}>Mật khẩu</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ThemedText style={styles.value}>{isShowingPassword ? password : '••••••••'}</ThemedText>
                            <TouchableOpacity onPress={() => setIsShowingPassword(!isShowingPassword)}>
                                <MaterialCommunityIcons name={isShowingPassword ? "eye-off" : "eye"} size={20} color={iconColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>

                {/* Actions */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.editBtn, { borderColor: primaryColor }]}
                        onPress={() => router.push({ pathname: '/chinhsuaaccount', params: { username: username || '', password: password || '', displayName: displayName || '', email: email || null } })}
                    >
                        <MaterialCommunityIcons name="account-edit-outline" size={20} color={primaryColor} />
                        <ThemedText style={[styles.editBtnText, { color: primaryColor }]}>Chỉnh sửa thông tin</ThemedText>
                    </TouchableOpacity>

                    <Button
                        title="Đăng Xuất"
                        onPress={handleLogout}
                        type="danger"
                        style={{ height: 50, borderRadius: 14 }}
                    />
                </View>

            </ScrollView>
        </ThemedView>
    )
}

export default Account;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#B5451B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    avatarText: {
        fontSize: 34,
        color: '#fff',
        fontFamily: 'PoppinsBold',
    },
    displayName: {
        marginBottom: 2,
        textAlign: 'center',
        fontSize: 22,
    },
    username: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    infoCard: {
        marginBottom: 24,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
        opacity: 0.5,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    value: {
        fontSize: 14,
        textAlign: 'right',
    },
    actionSection: {
        gap: 12,
    },
    editBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        height: 50,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    editBtnText: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
});
