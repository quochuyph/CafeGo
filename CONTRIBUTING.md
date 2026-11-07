# Đóng góp cho CaféGo

Cảm ơn bạn đã quan tâm đến dự án! 🎉

## Quy trình

1. Fork repository và tạo nhánh từ `main`:
   ```bash
   git checkout -b feat/ten-tinh-nang
   ```
2. Cài đặt và chạy dự án theo hướng dẫn trong [README](README.md#-cài-đặt--chạy-dự-án).
3. Commit theo chuẩn [Conventional Commits](https://www.conventionalcommits.org/vi/v1.0.0/):
   - `feat:` tính năng mới
   - `fix:` sửa lỗi
   - `refactor:` cải thiện code không đổi hành vi
   - `docs:` tài liệu
   - `chore:` cấu hình, dependencies
4. Đảm bảo code sạch trước khi tạo Pull Request:
   ```bash
   npm run lint
   npm run typecheck
   ```
5. Mở Pull Request và mô tả rõ thay đổi.

## Quy ước code

- TypeScript, bật `strict`.
- Import nội bộ dùng alias `@/` (trỏ tới `src/`) và `@assets/` (trỏ tới `assets/`).
- Màn hình đặt trong `src/app/(group)/`, component tái sử dụng đặt trong `src/components/`.
- Không commit file bí mật (`.env`, `credentials/`, service account).

