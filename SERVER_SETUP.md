# Music Player - Server Setup Guide

## 🚀 Hướng dẫn cài đặt server Node.js

### ⚡ Quick Start (3 bước đơn giản)

```bash
# Bước 1: Vào thư mục project
cd "C:\Users\Lenovo\Downloads\NĂM 3\Music Player\assets"

# Bước 2: Cài dependencies
npm install

# Bước 3: Chạy server
npm start
```

**Truy cập:** http://localhost:3000/component/index.html

**Thế thôi!** 🎉

## 📋 Yêu cầu

- ✅ Node.js (đã có sẵn trên máy)
- ✅ NPM (đi kèm với Node.js)

## 🎯 Tại sao dùng Node.js?

- 🚀 **Nhanh và đơn giản**
- 💾 **Tự động lưu file JSON** khi add/xóa bài hát
- 🔄 **Backup tự động** trước mỗi lần thay đổi
- ⚡ **Real-time** - không cần reload trang

## ✅ Kiểm tra hoạt động

1. **Thêm bài hát mới** → File `Music.json` tự động cập nhật ngay lập tức
2. **Xóa bài hát** → File `Music.json` tự động cập nhật, reload trang sẽ không thấy bài hát đã xóa

## 🔧 Troubleshooting

### ❌ Lỗi "npm is not recognized":
- **Nguyên nhân:** Node.js chưa được cài đặt
- **Giải pháp:** 
  - Download và cài Node.js: https://nodejs.org/
  - Restart Command Prompt sau khi cài

### ❌ Lỗi "Cannot find module":
- **Nguyên nhân:** Chưa cài dependencies
- **Giải pháp:** 
  ```bash
  cd "C:\Users\Lenovo\Downloads\NĂM 3\Music Player\assets"
  npm install
  ```

### ❌ Lỗi "Port 3000 already in use":
- **Nguyên nhân:** Port 3000 đang được sử dụng
- **Giải pháp:** 
  - Đóng ứng dụng đang dùng port 3000
  - Hoặc sửa port trong `server.js`: `const PORT = 3001;`

## 📝 Backup tự động

File `Music.json` sẽ được backup mỗi lần cập nhật với format:
```
Music.backup.2025-07-03T14-30-15-123Z.json
```

## 🎯 Tính năng chính

- ✅ **Auto-sync**: Tự động đồng bộ ngay khi add/xóa bài hát
- ✅ **Real-time**: Cập nhật file JSON ngay lập tức
- ✅ **Backup**: Tự động backup trước mỗi lần thay đổi
- ✅ **Fallback**: Nếu server không hoạt động, vẫn lưu local và hiển thị cảnh báo
- ✅ **No reload needed**: Không cần reload trang để thấy thay đổi
