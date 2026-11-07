import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { firestore } from '@/config/firebase';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

type StaffType = {
    docId: string;
    userId: string;
    username: string;
    displayName: string;
};

const QuanLyNhanVien = () => {
    useOwnerGuard();
    const insets = useSafeAreaInsets();

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const mutedColor = useThemeColor({}, 'muted');
    const errorColor = useThemeColor({}, 'error');
    const dangerBg = useThemeColor({}, 'dangerBg');
    const infoBg = useThemeColor({}, 'infoBg');

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<StaffType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const loadStaff = useCallback(async (ownerId: string) => {
        setLoading(true);
        try {
            const q = query(
                collection(firestore, 'taikhoan'),
                where('ownerId', '==', ownerId),
                where('role', '==', 'staff'),
            );
            const snap = await getDocs(q);
            const list = snap.docs.map(d => {
                const data = d.data();
                return {
                    docId: d.id,
                    userId: String(data.userId || d.id),
                    username: String(data.username || ''),
                    displayName: String(data.displayName || ''),
                };
            });
            setStaffList(list);
        } catch (error: any) {
            console.error('❌ Lỗi khi tải danh sách nhân viên:', error?.message || error);
            Alert.alert('Lỗi', 'Không thể tải danh sách nhân viên.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const storedUid = await AsyncStorage.getItem('userId');
            if (storedUid === null) {
                router.replace('/');
                return;
            }
            setCurrentUserId(storedUid);
            loadStaff(storedUid);
        };
        init();
    }, [loadStaff]);

    const resetForm = () => {
        setUsername('');
        setDisplayName('');
        setPassword('');
        setConfirmPassword('');
        setUsernameError('');
        setConfirmPasswordError('');
    };

    const handleAddStaff = async () => {
        setUsernameError('');
        setConfirmPasswordError('');

        const inputUsername = username.trim();
        const inputDisplayName = displayName.trim();

        if (!currentUserId) return;
        if (!inputUsername || !inputDisplayName || !password || !confirmPassword) {
            Alert.alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (password !== confirmPassword) {
            setConfirmPasswordError('Mật khẩu không khớp');
            return;
        }

        setSaving(true);
        try {
            const existed = await getDocs(query(collection(firestore, 'taikhoan'), where('username', '==', inputUsername)));
            if (!existed.empty) {
                setUsernameError('Username đã tồn tại');
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

            await addDoc(collection(firestore, 'taikhoan'), {
                userId: 'U_' + uuidv4(),
                username: inputUsername,
                passwordHash: hash,
                displayName: inputDisplayName,
                role: 'staff',
                ownerId: currentUserId,
                emailVerified: false,
                email: null,
                createdAt: new Date(),
            });

            Alert.alert('Thành công', `Đã tạo tài khoản nhân viên "${inputDisplayName}"`);
            resetForm();
            setShowForm(false);
            loadStaff(currentUserId);
        } catch (error: any) {
            Alert.alert('Lỗi', error?.message || 'Không thể tạo nhân viên.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStaff = (staff: StaffType) => {
        Alert.alert(
            'Xóa nhân viên',
            `Bạn có chắc chắn muốn xóa tài khoản "${staff.displayName || staff.username}"? Nhân viên này sẽ không thể đăng nhập nữa.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        if (!currentUserId) return;
                        try {
                            // Chỉ xóa đúng nhân viên thuộc quán của chủ quán hiện tại
                            const q = query(
                                collection(firestore, 'taikhoan'),
                                where('userId', '==', staff.userId),
                                where('ownerId', '==', currentUserId),
                                where('role', '==', 'staff'),
                            );
                            const snap = await getDocs(q);
                            for (const d of snap.docs) {
                                await deleteDoc(d.ref);
                            }
                            loadStaff(currentUserId);
                        } catch (error: any) {
                            Alert.alert('Lỗi', error?.message || 'Không thể xóa nhân viên.');
                        }
                    },
                },
            ],
        );
    };

    const renderItem = ({ item }: { item: StaffType }) => (
        <Card variant="elevated" style={[styles.staffCard, { backgroundColor: cardColor }]}>
            <View style={[styles.avatar, { backgroundColor: infoBg }]}>
                <ThemedText style={[styles.avatarLetter, { color: primaryColor }]}>
                    {(item.displayName || item.username).charAt(0).toUpperCase()}
                </ThemedText>
            </View>
            <View style={styles.staffInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.displayName || item.username}</ThemedText>
                <ThemedText style={[styles.staffSub, { color: mutedColor }]} numberOfLines={1}>@{item.username}</ThemedText>
            </View>
            <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: dangerBg }]}
                onPress={() => handleDeleteStaff(item)}
                accessibilityLabel="Xóa nhân viên"
            >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={errorColor} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    data={staffList}
                    keyExtractor={(item) => item.docId}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <View>
                            {showForm ? (
                                <Card variant="elevated" style={[styles.formCard, { backgroundColor: cardColor }]}>
                                    <ThemedText type="defaultSemiBold" style={styles.formTitle}>Thêm nhân viên mới</ThemedText>
                                    <Input
                                        label="Username"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        error={usernameError}
                                    />
                                    <Input
                                        label="Tên hiển thị"
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        autoCapitalize="words"
                                    />
                                    <Input
                                        label="Mật khẩu"
                                        value={password}
                                        onChangeText={setPassword}
                                        isPassword
                                    />
                                    <Input
                                        label="Xác nhận mật khẩu"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        isPassword
                                        error={confirmPasswordError}
                                    />
                                    <View style={styles.formActions}>
                                        <Button
                                            title="Hủy"
                                            type="outline"
                                            onPress={() => { resetForm(); setShowForm(false); }}
                                            style={styles.formBtn}
                                        />
                                        <Button
                                            title="Tạo tài khoản"
                                            onPress={handleAddStaff}
                                            loading={saving}
                                            style={styles.formBtn}
                                        />
                                    </View>
                                </Card>
                            ) : (
                                <Button
                                    title="+ Thêm nhân viên"
                                    onPress={() => setShowForm(true)}
                                    style={styles.addBtn}
                                />
                            )}
                            <ThemedText style={[styles.sectionTitle, { color: mutedColor }]}>
                                DANH SÁCH NHÂN VIÊN ({staffList.length})
                            </ThemedText>
                        </View>
                    }
                    ListEmptyComponent={
                        loading ? (
                            <ActivityIndicator style={{ marginTop: 24 }} color={primaryColor} />
                        ) : (
                            <View style={styles.emptyState}>
                                <ThemedText style={{ fontSize: 40 }}>🧑‍🍳</ThemedText>
                                <ThemedText style={[styles.emptyText, { color: mutedColor }]}>Chưa có nhân viên nào</ThemedText>
                            </View>
                        )
                    }
                />
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

export default QuanLyNhanVien;

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 20 },
    addBtn: { minHeight: 50, borderRadius: 12, marginBottom: 20 },
    formCard: { padding: 18, borderRadius: 20, marginBottom: 20 },
    formTitle: { fontSize: 16, marginBottom: 14 },
    formActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    formBtn: { flex: 1, minHeight: 48, borderRadius: 12 },
    sectionTitle: { fontSize: 12, fontFamily: 'PoppinsBold', letterSpacing: 1.1, marginBottom: 12 },
    staffCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarLetter: { fontSize: 18, fontFamily: 'PoppinsBold' },
    staffInfo: { flex: 1 },
    staffSub: { fontSize: 13, marginTop: 2 },
    deleteBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    emptyState: { alignItems: 'center', marginTop: 32 },
    emptyText: { marginTop: 8, fontSize: 14 },
});

