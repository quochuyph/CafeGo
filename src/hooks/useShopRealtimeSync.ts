import type { SQLiteDatabase } from 'expo-sqlite';
import { collection, DocumentData, onSnapshot, query, QuerySnapshot, where } from 'firebase/firestore';
import { useEffect } from 'react';

import { firestore } from '@/config/firebase';

export type ShopCollection = 'ban' | 'menu' | 'nhommon' | 'hoadon' | 'chitiethd';

type SyncListener = (col: ShopCollection) => void;

const listeners = new Set<SyncListener>();

function notifyListeners(col: ShopCollection) {
    listeners.forEach((listener) => {
        try {
            listener(col);
        } catch (err) {
            console.error('Lỗi listener đồng bộ:', err);
        }
    });
}

/**
 * Đăng ký callback chạy lại mỗi khi SQLite vừa được cập nhật realtime từ Firestore.
 */
export function useOnShopDataSynced(
    collections: ShopCollection[],
    onSynced: () => void,
) {
    useEffect(() => {
        const handler: SyncListener = (col) => {
            if (collections.includes(col)) {
                onSynced();
            }
        };
        listeners.add(handler);
        return () => {
            listeners.delete(handler);
        };
    }, [collections, onSynced]);
}

async function upsertBan(db: SQLiteDatabase, item: DocumentData, ownerId: string) {
    const uId = String(item.userId || ownerId);
    if (item.MaBan != null) {
        await db.runAsync(
            'INSERT OR REPLACE INTO ban (MaBan, TenBan, TrangThai, userId) VALUES (?, ?, ?, ?);',
            [Number(item.MaBan), String(item.TenBan || ''), String(item.TrangThai || 'Trống'), uId],
        );
    }
}

async function upsertNhomMon(db: SQLiteDatabase, item: DocumentData, ownerId: string) {
    const uId = String(item.userId || ownerId);
    if (item.MaLoai != null) {
        await db.runAsync(
            'INSERT OR REPLACE INTO nhommon (MaLoai, TenLoai, userId) VALUES (?, ?, ?);',
            [Number(item.MaLoai), String(item.TenLoai || ''), uId],
        );
    }
}

async function upsertMenu(db: SQLiteDatabase, item: DocumentData, ownerId: string) {
    const uId = String(item.userId || ownerId);
    if (item.MaMon != null) {
        await db.runAsync(
            'INSERT OR REPLACE INTO menu (MaMon, TenMon, MaLoai, DonGia, DVT, userId) VALUES (?, ?, ?, ?, ?, ?);',
            [
                Number(item.MaMon),
                String(item.TenMon || ''),
                Number(item.MaLoai || 0),
                Number(item.DonGia || 0),
                String(item.DVT || ''),
                uId,
            ],
        );
    }
}

async function upsertHoaDon(db: SQLiteDatabase, item: DocumentData, ownerId: string) {
    const uId = String(item.userId || ownerId);
    if (item.MaHoaDon != null) {
        await db.runAsync(
            'INSERT OR REPLACE INTO hoadon (MaHoaDon, GiamGia, MaBan, GioDen, TongTien, TrangThai, userId) VALUES (?,?,?,?,?,?,?);',
            [
                Number(item.MaHoaDon),
                Number(item.GiamGia || 0),
                Number(item.MaBan || 0),
                String(item.GioDen || new Date().toISOString()),
                Number(item.TongTien || 0),
                Number(item.TrangThai || 0),
                uId,
            ],
        );
    }
}

async function upsertChiTietHD(db: SQLiteDatabase, item: DocumentData, ownerId: string) {
    const uId = String(item.userId || ownerId);
    if (item.MaChiTietHD != null) {
        await db.runAsync(
            'INSERT OR REPLACE INTO chitiethd (MaChiTietHD, MaHoaDon, MaMon, SoLuong, Gia, userId) VALUES (?,?,?,?,?,?);',
            [
                Number(item.MaChiTietHD),
                Number(item.MaHoaDon || 0),
                Number(item.MaMon || 0),
                Number(item.SoLuong || 0),
                Number(item.Gia || 0),
                uId,
            ],
        );
    }
}

const COLLECTION_META: Record<
    ShopCollection,
    {
        pk: string;
        upsert: (db: SQLiteDatabase, item: DocumentData, ownerId: string) => Promise<void>;
    }
> = {
    ban: { pk: 'MaBan', upsert: upsertBan },
    nhommon: { pk: 'MaLoai', upsert: upsertNhomMon },
    menu: { pk: 'MaMon', upsert: upsertMenu },
    hoadon: { pk: 'MaHoaDon', upsert: upsertHoaDon },
    chitiethd: { pk: 'MaChiTietHD', upsert: upsertChiTietHD },
};

/**
 * Lắng nghe realtime (onSnapshot) 5 collection của quán theo activeOwnerId
 * và đồng bộ tuần tự vào SQLite cục bộ (bao gồm thêm, sửa, xóa).
 */
export function useShopRealtimeSync(database: SQLiteDatabase, activeOwnerId: string | null) {
    useEffect(() => {
        if (!activeOwnerId) return;

        let unmounted = false;
        let writeQueue = Promise.resolve();

        const enqueue = (task: () => Promise<void>) => {
            writeQueue = writeQueue.then(task, task);
        };

        const subscribeCollection = (col: ShopCollection) => {
            const { pk, upsert } = COLLECTION_META[col];
            let isFirstSnapshot = true;

            const q = query(collection(firestore, col), where('userId', '==', activeOwnerId));

            return onSnapshot(
                q,
                (snapshot: QuerySnapshot<DocumentData>) => {
                    enqueue(async () => {
                        if (unmounted) return;
                        try {
                            if (isFirstSnapshot) {
                                isFirstSnapshot = false;
                                const ids = snapshot.docs
                                    .map((d) => d.data()[pk])
                                    .filter((id) => id != null)
                                    .map((id) => Number(id));

                                if (ids.length === 0) {
                                    await database.runAsync(
                                        `DELETE FROM ${col} WHERE userId = ?;`,
                                        [activeOwnerId],
                                    );
                                } else {
                                    const placeholders = ids.map(() => '?').join(',');
                                    await database.runAsync(
                                        `DELETE FROM ${col} WHERE userId = ? AND ${pk} NOT IN (${placeholders});`,
                                        [activeOwnerId, ...ids],
                                    );
                                }

                                for (const d of snapshot.docs) {
                                    await upsert(database, d.data(), activeOwnerId);
                                }
                            } else {
                                for (const change of snapshot.docChanges()) {
                                    const data = change.doc.data();
                                    if (change.type === 'removed') {
                                        if (data[pk] != null) {
                                            await database.runAsync(
                                                `DELETE FROM ${col} WHERE ${pk} = ? AND userId = ?;`,
                                                [Number(data[pk]), activeOwnerId],
                                            );
                                        }
                                    } else {
                                        await upsert(database, data, activeOwnerId);
                                    }
                                }
                            }

                            if (!unmounted) {
                                notifyListeners(col);
                            }
                        } catch (error) {
                            console.error(`❌ Lỗi đồng bộ realtime [${col}]:`, error);
                        }
                    });
                },
                (error) => {
                    console.error(`❌ Lỗi lắng nghe Firestore [${col}]:`, error);
                },
            );
        };

        const unsubscribers = (Object.keys(COLLECTION_META) as ShopCollection[]).map(
            subscribeCollection,
        );

        return () => {
            unmounted = true;
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [database, activeOwnerId]);
}

