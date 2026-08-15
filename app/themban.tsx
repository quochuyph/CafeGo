import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { addDoc, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { firestore } from '../firebaseConfig.js';

const ThemBan = () => {
    const { MaBan } = useLocalSearchParams()

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [tenBan, setTenBan] = useState('')
    const [editMode, setEditMode] = useState(false)

    const database = useSQLiteContext()
    const [uid, setUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUid = async () => {
            const storedUid = await AsyncStorage.getItem("userId");
            setUid(storedUid);
            setLoading(false);
            if (storedUid === null) {
                router.replace('/');
            }
        };
        loadUid();
    }, []);

    useEffect(() => {
        if (MaBan) {
            setEditMode(true)
            loadData()
        }
    }, [MaBan])

    const loadData = async () => {
        const result = await database.getFirstAsync<{
            TenBan: string;
        }>("SELECT TenBan FROM ban WHERE MaBan = ?;", [parseInt(MaBan as string)]);
        if (result) setTenBan(result.TenBan);
    }

    const handleSave = async () => {
        if (!tenBan.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên bàn');
            return;
        }
        setLoading(true)
        try {
            const result = await database.runAsync("INSERT INTO ban (TenBan, TrangThai, userId) VALUES (?, ?, ?);", [
                tenBan.trim(),
                'Trống',
                uid
            ])

            const newMaBan = result.lastInsertRowId

            await addDoc(collection(firestore, 'ban'), {
                MaBan: newMaBan,
                TenBan: tenBan.trim(),
                TrangThai: 'Trống',
                userId: uid
            })

            Alert.alert('Thành công', 'Đã thêm bàn mới thành công!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!tenBan.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên bàn');
            return;
        }
        setLoading(true)
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
            setLoading(false)
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
            <View style={styles.content}>
                <Card style={[styles.card, { backgroundColor: cardColor, borderColor }]} variant="elevated">
                    <View style={styles.iconCircle}>
                        <MaterialIcons name="table-restaurant" size={32} color={primaryColor} />
                    </View>

                    <ThemedText type="title" style={styles.formTitle}>
                        {editMode ? "Chỉnh Sửa Bàn" : "Thêm Bàn Mới"}
                    </ThemedText>

                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Tên Bàn <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor }]}
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
                        loading={loading}
                        style={styles.submitBtn}
                    />
                </Card>
            </View>
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
        backgroundColor: '#F5EDE6',
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
        height: 50,
        paddingHorizontal: 16,
        fontFamily: 'Poppins',
    },
    submitBtn: {
        width: '100%',
        height: 50,
        borderRadius: 12,
    },
})