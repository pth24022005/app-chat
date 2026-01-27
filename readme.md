
# 🎤 EventLive – Hệ thống Chat Sự kiện Thời Gian Thực

## 📑 Mục lục
- [Giới thiệu hệ thống](#giới-thiệu-hệ-thống)
- [Tính năng chính](#tính-năng-chính)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Luồng hoạt động hệ thống](#luồng-hoạt-động-hệ-thống)
- [Cài đặt và chạy hệ thống](#cài-đặt-và-chạy-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Phân quyền người dùng](#phân-quyền-người-dùng)
- [Ứng dụng phân tán trong hệ thống](#ứng-dụng-phân-tán-trong-hệ-thống)
- [Kiểm thử](#kiểm-thử)
- [Hướng phát triển](#hướng-phát-triển)
- [Thông tin sinh viên](#thông-tin-sinh-viên)

## 🧾 Giới thiệu hệ thống
EventLive là hệ thống chat thời gian thực cho các sự kiện trực tuyến, cho phép người dùng tham gia theo **Event ID**, gửi và nhận tin nhắn ngay lập tức, đồng thời lưu lại lịch sử trò chuyện.

Hệ thống được xây dựng nhằm minh họa rõ ràng mô hình **ứng dụng phân tán (Distributed Application)**, phù hợp cho bài tập lớn hoặc đồ án môn *Ứng dụng phân tán*.

## ⭐ Tính năng chính

### 👤 Người dùng (User)
- Đăng ký và đăng nhập tài khoản  
- Tham gia sự kiện bằng **Event ID**  
- Chat thời gian thực với các người dùng trong cùng sự kiện  
- Xem lại lịch sử chat khi tải lại trang  
- Nhận thông báo khi có người tham gia sự kiện  

### 👨‍💼 Quản trị viên (Admin)
- Đăng nhập với quyền admin  
- Xem toàn bộ tin nhắn của tất cả các sự kiện  
- Xóa sự kiện (toàn bộ tin nhắn liên quan sẽ bị xóa)  
- Theo dõi tin nhắn mới theo thời gian thực  

### 🖥️ Hệ thống
- Giao tiếp realtime bằng **Socket.IO**  
- Lưu trữ dữ liệu bằng **MongoDB**  
- Hỗ trợ nhiều client kết nối đồng thời  
- Phân chia phòng chat theo từng event  
## Kiến trúc hệ thống

```text
+--------------------------------------------------+
|                    Client                        |
|               (Web Browser)                      |
|                                                  |
|  - Login / Register                              |
|  - Join Event                                    |
|  - Realtime Chat                                 |
|  - Admin Dashboard                               |
+-------------------------▲------------------------+
                          |
                          | HTTP / Socket.IO
                          |
+-------------------------▼------------------------+
|                    Server                        |
|             (Node.js + Express)                  |
|                                                  |
|  - REST API                                      |
|    • Authentication                              |
|    • Event Management                            |
|                                                  |
|  - Socket.IO                                     |
|    • Join Event Room                             |
|    • Send / Receive Messages                    |
|    • User Join / Leave                           |
|                                                  |
|  - Role Control                                  |
|    • Admin                                       |
|    • User                                        |
+-------------------------▲------------------------+
                          |
                          | Mongoose (ODM)
                          |
+-------------------------▼------------------------+
|                    MongoDB                       |
|                                                  |
|  - Users                                         |
|    • username                                    |
|    • password (hashed)                           |
|    • role                                        |
|                                                  |
|  - Events                                        |
|    • title                                       |
|    • description                                 |
|    • createdBy                                   |
|                                                  |
|  - Messages                                      |
|    • eventId                                     |
|    • sender                                      |
|    • content                                     |
|    • createdAt                                   |
+--------------------------------------------------+
- Hệ thống bao gồm nhiều thành phần chạy độc lập và giao tiếp qua mạng, thể hiện rõ tính phân tán về xử lý và dữ liệu.
```
## Cấu trúc thư mục
```text
eventlive/
│
├── client/
│   └── public/
│       ├── index.html        # Giao diện chat user
│       ├── admin.html        # Giao diện admin
│       ├── login.html        # Đăng nhập
│       ├── register.html     # Đăng ký
│       └── client.js         # Xử lý Socket.IO phía client
│
├── src/
│   ├── models/
│   │   ├── User.js           # Schema User
│   │   └── Message.js        # Schema Message
│   └── server.js             # Server Node.js + Socket.IO
│
├── .env                      # Biến môi trường
├── package.json
├── package-lock.json
└── README.md
```
## 🔄 Luồng hoạt động hệ thống
- Người dùng truy cập ứng dụng thông qua trình duyệt  
- Đăng ký hoặc đăng nhập tài khoản  
- Client kết nối tới server bằng **Socket.IO**  
- Người dùng nhập **Event ID** để tham gia sự kiện  
- Server cho client join vào **room** tương ứng  
- Server tải lịch sử chat từ **MongoDB** và gửi về client  

**Khi người dùng gửi tin nhắn:**
- Tin nhắn được gửi lên server  
- Server lưu tin nhắn vào MongoDB  
- Server broadcast tin nhắn tới các client trong cùng event  

---

## 🚀 Cài đặt và chạy hệ thống

### 1. Cài đặt dependencies
```bash
npm install
```
### 2. Cấu hình môi trường
Tạo file `.env` tại thư mục gốc:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventlive
```
### 3. Chạy hệ thống
```bash
npm run dev
```
### 4. Truy cập hệ thống
Truy cập `http://localhost:5000` trong trình duyệt để sử dụng hệ thống.

---

## 🔌 Công nghệ sử dụng

### Backend
- Node.js  
- Express.js  
- Socket.IO  
- MongoDB  
- Mongoose  
- Bcrypt (mã hóa mật khẩu)  

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla)  
- Tailwind CSS  

---

## 🔐 Phân quyền người dùng
Hệ thống áp dụng mô hình phân quyền cơ bản:

### User
- Tham gia sự kiện  
- Gửi và nhận tin nhắn  
- Không có quyền quản lý event  

### Admin
- Xem toàn bộ tin nhắn của các event  
- Xóa event và toàn bộ tin nhắn liên quan  
- Theo dõi hoạt động realtime của hệ thống  

> Phân quyền được kiểm soát cả ở **client-side** và **server-side**.

---

## 🧠 Ứng dụng phân tán trong hệ thống
EventLive thể hiện đầy đủ các đặc điểm của một ứng dụng phân tán:
- Nhiều client hoạt động đồng thời trên các thiết bị khác nhau  
- Server xử lý trung tâm hoạt động độc lập  
- MongoDB là hệ thống lưu trữ dữ liệu riêng biệt  
- Các thành phần giao tiếp qua mạng Internet  
- Dữ liệu được đồng bộ theo thời gian thực  

---

## 🧪 Kiểm thử
- Mở nhiều tab trình duyệt khác nhau  
- Đăng nhập bằng nhiều tài khoản  
- Tham gia cùng một **Event ID**  
- Gửi tin nhắn và kiểm tra realtime  
- Reload trang để kiểm tra lịch sử chat  
- Đăng nhập admin để kiểm tra chức năng xóa event  
## 📈 Hướng phát triển
- Áp dụng **JWT** cho xác thực nâng cao  
- Quản lý user (khóa/mở tài khoản)  
- Giao diện hiện đại hơn với **React / Vue**  
- Tối ưu hiệu năng cho số lượng lớn client  
- Triển khai hệ thống lên nền tảng **cloud**  

---

## 📝 Thông tin sinh viên
- **Sinh viên thực hiện:** Nguyễn Đức Hiếu, Phạm Thanh Hải, Đỗ Tiến Hải
- **Mã sinh viên:** 23010614, 23010677, 23010615 
- **Môn học:** Ứng dụng phân tán  
- **Giảng viên hướng dẫn:** Nguyễn Hữu Đạt 

---

⚠️ **Lưu ý:** Đây là hệ thống demo phục vụ mục đích học tập.


