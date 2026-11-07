import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getActiveOwnerId } from '@/hooks/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { firestore } from '@/config/firebase';

const ThemBan = () => {
    useOwnerGuard();
    const { MaBan } = useLocalSearchParams()

    const primaryColor = useThemeColor({}, 'primary');
    const secondaryColor = useThemeColor({}, 'secondary');
    const cardColor = useThemeColor({}, 'card');
    const inputBg = useThemeColor({}, 'inputBackground');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');
    const errorColor = useThemeColor({}, 'error');

    const [tenBan, setTenBan] = useState('')
    const editMode = Boolean(MaBan)
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null)

    const database = useSQLiteContext()
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await getActiveOwnerId();
            setUid(storedUid);
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
            }
        };
        loadUid();
    }, []);

    useEffect(() => {
        if (!MaBan) return;
        const loadData = async () => {
            const result = await database.getFirstAsync<{
                TenBan: string;
            }>("SELECT TenBan FROM ban WHERE MaBan = ?;", [parseInt(MaBan as string)]);
            if (result) setTenBan(result.TenBan);
        };
        loadData();
    }, [MaBan, database])

    const handleSave = async () => {
        if (!tenBan.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên bàn');
            return;
        }
        setSaving(true)
        try {
            const trimmedName = tenBan.trim();
            const result = await database.runAsync("INSERT INTO ban (TenBan, TrangThai, userId) VALUES (?, ?, ?);", [
                trimmedName,
                'Trống',
                uid
            ])

            const newMaBan = result.lastInsertRowId

            await addDoc(collection(firestore, 'ban'), {
                MaBan: newMaBan,
                TenBan: trimmedName,
                TrangThai: 'Trống',
                userId: uid
            })

            setTenBan('');
            Alert.alert('Thành công', `Đã thêm "${trimmedName}"! Bạn có thể tiếp tục thêm bàn tiếp theo.`, [
                {
                    text: 'OK',
                    onPress: () => {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    },
                },
            ]);
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdate = async () => {
        if (!tenBan.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên bàn');
            return;
        }
        setSaving(true)
        try {
            const q = query(
                collection(firestore, "ban"),
                where("MaBan", "==", parseInt(MaBan as string)),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TenBan: tenBan.trim()
                });
            }

            await database.runAsync(
                `UPDATE ban SET TenBan = ? WHERE MaBan = ? AND userId = ?;`,
                [tenBan.trim(), parseInt(MaBan as string), uid]
            )

            Alert.alert('Thành công', 'Đã cập nhật tên bàn thành công!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Error updating item:", error)
        } finally {
            setSaving(false)
        }
    }

    if (loading || uid === null) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={{ padding: 24, textAlign: 'center' }}>Đang tải...</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Card style={[styles.card, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                        <View style={[styles.iconCircle, { backgroundColor: secondaryColor }]}>
                            <MaterialIcons name="table-restaurant" size={32} color={primaryColor} />
                        </View>

                        <ThemedText type="title" style={styles.formTitle}>
                            {editMode ? "Chỉnh Sửa Bàn" : "Thêm Bàn Mới"}
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText type="defaultSemiBold" style={styles.label}>
                                Tên Bàn <ThemedText style={{ color: errorColor }}>*</ThemedText>
                            </ThemedText>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, { color: textColor, backgroundColor: inputBg, borderColor }]}
                                value={tenBan}
                                onChangeText={setTenBan}
                                placeholder="Ví dụ: Bàn 01, Bàn VIP 2..."
                                placeholderTextColor={mutedColor}
                                autoFocus
                            />
                        </View>

                        <Button
                            title={editMode ? "Cập Nhật" : "Lưu Bàn"}
                            onPress={editMode ? handleUpdate : handleSave}
                            loading={saving}
                            style={styles.submitBtn}
                        />
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}

export default ThemBan

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 32,
    },
    card: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        width: '100%',
        borderWidth: 1.5,
        borderRadius: 12,
        fontSize: 15,
        minHeight: 50,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: 'Poppins',
        textAlignVertical: 'center',
    },
    submitBtn: {
        width: '100%',
        minHeight: 50,
        borderRadius: 12,
    },
})