# 🎤 EventLive – Hệ thống Chat Sự kiện Thời Gian Thực

## 📑 Mục lục

1. [Giới thiệu hệ thống](#-giới-thiệu-hệ-thống)
2. [Tính năng chính](#-tính-năng-chính)
3. [Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống-distributed-architecture)
4. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
5. [Luồng hoạt động hệ thống](#-luồng-hoạt-động-hệ-thống)
6. [Cài đặt và chạy hệ thống](#-cài-đặt-và-chạy-hệ-thống)
7. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
8. [Ứng dụng phân tán trong hệ thống](#-ứng-dụng-phân-tán-trong-hệ-thống)
9. [Kiểm thử](#-kiểm-thử)
10. [Hướng phát triển](#-hướng-phát-triển)
11. [Thông tin sinh viên](#-thông-tin-sinh-viên)

---

## 🧾 Giới thiệu hệ thống

EventLive là hệ thống chat thời gian thực cho các sự kiện trực tuyến, cho phép người dùng tham gia theo **event/room**, gửi – nhận tin nhắn ngay lập tức và lưu lại lịch sử trò chuyện.

Hệ thống được xây dựng nhằm minh họa rõ ràng **mô hình ứng dụng phân tán (Distributed Application)**, phù hợp cho bài tập lớn / đồ án môn Ứng dụng phân tán.

---

## ⭐ Tính năng chính

### 👨‍💼 Người dùng (User)

* Tham gia sự kiện bằng **Event ID**
* Chat thời gian thực với những người cùng sự kiện
* Xem lịch sử tin nhắn khi vào lại sự kiện
* Nhận thông báo khi có người tham gia / rời sự kiện

### 🖥️ Hệ thống

* Giao tiếp realtime bằng **Socket.IO**
* Lưu trữ lịch sử chat bằng **MongoDB**
* Hỗ trợ nhiều client kết nối đồng thời
* Phân chia phòng chat theo từng event

---

## 🏗️ Kiến trúc hệ thống (Distributed Architecture)

```
┌────────────────────┐
│      Client        │
│ (Web Browser)      │
│                    │
│ - Gửi/nhận chat    │
│ - Join Event       │
└─────────▲──────────┘
          │ Socket.IO
          ▼
┌────────────────────┐
│      Server        │
│   (Node.js)        │
│                    │
│ - Quản lý room     │
│ - Broadcast chat   │
│ - Lưu tin nhắn     │
└─────────▲──────────┘
          │ Mongoose
          ▼
┌────────────────────┐
│     MongoDB        │
│                    │
│ - Lưu message      │
│ - Lưu event        │
└────────────────────┘
```

Hệ thống gồm nhiều thành phần chạy độc lập và giao tiếp với nhau qua mạng, thể hiện rõ tính **phân tán về xử lý và dữ liệu**.

---

## 📁 Cấu trúc thư mục

```
eventlive/
│
├── client/
│   └── public/
│       ├── index.html      # Giao diện người dùng
│       ├── style.css       # CSS giao diện
│       └── client.js       # Xử lý Socket.IO phía client
│
├── src/
│   ├── models/
│   │   └── Message.js      # Schema MongoDB
│   └── server.js           # Server Node.js + Socket.IO
│
├── .env                    # Biến môi trường
├── package.json
├── package-lock.json
└── README.md
```

---

## 🔄 Luồng hoạt động hệ thống

1. Người dùng truy cập ứng dụng qua trình duyệt
2. Client kết nối đến server bằng Socket.IO
3. Người dùng nhập tên và Event ID
4. Server cho user join vào room tương ứng
5. Server load lịch sử chat từ MongoDB
6. Khi user gửi tin nhắn:

   * Tin nhắn được gửi lên server
   * Server lưu tin nhắn vào MongoDB
   * Server broadcast tin nhắn đến các client trong cùng event

---

## 🚀 Cài đặt và chạy hệ thống

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` ở thư mục gốc:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventlive
```

---

### 3. Chạy server

```bash
npm run dev
```

Server sẽ chạy tại:

```
http://localhost:5000
```

---

## 🔌 Công nghệ sử dụng

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB
* Mongoose

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla)

---

## 🧠 Ứng dụng phân tán trong hệ thống

EventLive thể hiện rõ các đặc điểm của ứng dụng phân tán:

* Nhiều client chạy trên các máy khác nhau
* Server xử lý trung tâm hoạt động độc lập
* MongoDB là hệ thống lưu trữ dữ liệu riêng biệt
* Giao tiếp qua mạng Internet
* Dữ liệu được đồng bộ theo thời gian thực

---

## 🧪 Kiểm thử

* Mở nhiều tab trình duyệt
* Tham gia cùng một Event ID
* Gửi tin nhắn và kiểm tra realtime
* Reload trang để kiểm tra load lịch sử chat

---

## 📈 Hướng phát triển

* Xác thực người dùng
* Phân quyền admin / user
* Giao diện hiện đại hơn (React, Tailwind)
* Triển khai lên cloud (Render, Railway, Vercel)

---

## 📝 Thông tin sinh viên

* **Sinh viên thực hiện**: *(Điền tên)*
* **Môn học**: Ứng dụng phân tán
* **Giảng viên hướng dẫn**: *(Điền tên)*

---

⚠️ **Lưu ý**: Đây là hệ thống demo phục vụ mục đích học tập.
