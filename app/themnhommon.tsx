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

const ThemNhomMon = () => {
    const { MaLoai, userId } = useLocalSearchParams()

    const primaryColor = useThemeColor({}, 'primary');
    const cardColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const mutedColor = useThemeColor({}, 'muted');
    const textColor = useThemeColor({}, 'text');

    const [tenLoai, setTenLoai] = useState('')
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
        if (MaLoai && userId) {
            setEditMode(true)
            loadData(userId.toString())
        }
    }, [MaLoai])

    const loadData = async (userIdStr: string) => {
        const result = await database.getFirstAsync<{
            TenLoai: string;
        }>("SELECT TenLoai FROM nhommon WHERE MaLoai = ? AND userId = ?;", [parseInt(MaLoai as string), userIdStr]);
        if (result) setTenLoai(result.TenLoai);
    }

    const handleSave = async () => {
        if (!tenLoai.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm món');
            return;
        }
        setLoading(true)
        try {
            const result = await database.runAsync(
                "INSERT INTO nhommon (TenLoai, userId) VALUES (?, ?);",
                [tenLoai.trim(), uid]
            );

            const maLoai = result.lastInsertRowId;

            await addDoc(collection(firestore, "nhommon"), {
                MaLoai: maLoai,
                TenLoai: tenLoai.trim(),
                userId: uid,
            });

            Alert.alert('Thành công', 'Đã thêm nhóm món mới!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!tenLoai.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm món');
            return;
        }
        setLoading(true)
        try {
            const q = query(
                collection(firestore, "nhommon"),
                where("MaLoai", "==", parseInt(MaLoai as string)),
                where("userId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    TenLoai: tenLoai.trim()
                });
            }

            await database.runAsync(
                `UPDATE nhommon SET TenLoai = ? WHERE MaLoai = ? AND userId = ?`,
                [tenLoai.trim(), parseInt(MaLoai as string), uid]
            )

            Alert.alert('Thành công', 'Đã cập nhật nhóm món!', [
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
                        <MaterialIcons name="category" size={32} color={primaryColor} />
                    </View>

                    <ThemedText type="title" style={styles.formTitle}>
                        {editMode ? "Chỉnh Sửa Nhóm Món" : "Thêm Nhóm Món Mới"}
                    </ThemedText>

                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={styles.label}>
                            Tên Loại Món <ThemedText style={{ color: '#E74C3C' }}>*</ThemedText>
                        </ThemedText>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor }]}
                            value={tenLoai}
                            onChangeText={setTenLoai}
                            placeholder="Ví dụ: Cà phê, Trà sữa, Nước ép..."
                            placeholderTextColor={mutedColor}
                            autoFocus
                        />
                    </View>

                    <Button
                        title={editMode ? "Cập Nhật" : "Lưu Nhóm Món"}
                        onPress={editMode ? handleUpdate : handleSave}
                        loading={loading}
                        style={styles.submitBtn}
                    />
                </Card>
            </View>
        </ThemedView>
    )
}

export default ThemNhomMon

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