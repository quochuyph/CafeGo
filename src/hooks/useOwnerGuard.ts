import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { getUserRole } from '@/hooks/auth';

/**
 * Chặn nhân viên (role "staff") truy cập các màn hình chỉ dành cho chủ quán.
 * Tài khoản cũ không có role được coi là "owner" nên không bị ảnh hưởng.
 */
export function useOwnerGuard() {
    useEffect(() => {
        let cancelled = false;
        getUserRole().then((role) => {
            if (!cancelled && role === 'staff') {
                Alert.alert('Không có quyền', 'Chức năng này chỉ dành cho chủ quán.');
                router.replace('/dashboard');
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
}

