import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Local SQLite schema (offline cache, mirrored to Cloud Firestore).
 *
 * - ban        : Tables in the café
 * - nhommon    : Menu categories
 * - menu       : Menu items (food & drinks)
 * - hoadon     : Invoices / orders
 * - chitiethd  : Invoice line items
 */
const SCHEMA: string[] = [
  'CREATE TABLE IF NOT EXISTS ban (MaBan INTEGER PRIMARY KEY AUTOINCREMENT, TenBan TEXT NOT NULL, TrangThai TEXT NOT NULL, userId TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS chitiethd (MaChiTietHD INTEGER PRIMARY KEY AUTOINCREMENT, MaHoaDon INTEGER NOT NULL, MaMon INTEGER NOT NULL, SoLuong INTEGER NOT NULL, Gia INTEGER NOT NULL, userId TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS hoadon (MaHoaDon INTEGER PRIMARY KEY AUTOINCREMENT, GiamGia INTEGER DEFAULT NULL, MaBan INTEGER NOT NULL, GioDen DATETIME NOT NULL, TongTien INTEGER DEFAULT NULL, TrangThai INTEGER DEFAULT 0, userId TEXT NOT NULL )',
  'CREATE TABLE IF NOT EXISTS nhommon (MaLoai INTEGER PRIMARY KEY AUTOINCREMENT, TenLoai TEXT NOT NULL, userId TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS menu (MaMon INTEGER PRIMARY KEY AUTOINCREMENT, TenMon TEXT NOT NULL, MaLoai INTEGER NOT NULL, DonGia INTEGER NOT NULL, DVT TEXT NOT NULL, userId TEXT NOT NULL);',
];

/** Creates all tables if needed. Passed to `<SQLiteProvider onInit={...} />`. */
export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  try {
    console.log('creating database if needed');
    for (const statement of SCHEMA) {
      await db.execAsync(statement);
    }
  } catch (error) {
    console.error('DB init error:', error);
  }
}

