# Video demo ( hướng dẫn sử dụng ) 

https://github.com/NhatDoo/DATN/tree/datn

# Hướng dẫn chạy dự án bằng Docker

Tài liệu này hướng dẫn cách build và chạy toàn bộ dự án (Frontend, Backend, và các dịch vụ hạ tầng) sử dụng Docker Compose.

## 1. Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

- **Docker**: [Tải Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Git**: (Để clone source code)

## 2. Cấu trúc dự án

Dự án bao gồm các thành phần chính được định nghĩa trong `docker-compose.yml`:

- **Frontend**: Ứng dụng Next.js chạy ở cổng `3000`.
- **Backend Microservices**:
  - `users-service`: Cổng `3001`
  - `course-service`: Cổng `3002`
  - `enrollment-service`: Cổng `3003`
  - `order-payment-service`: Cổng `3004`
  - `recommend-service`: Cổng `3005`
  - `storage-video-service`: Cổng `3006`
  - `rag-service`: Cổng `3007`
- **Hạ tầng (Infrastructure)**:
  - **PostgreSQL**: Cơ sở dữ liệu chính (Cổng `5432`).
  - **RabbitMQ**: Message broker (Quản lý tại cổng `15672`).
  - **MinIO**: Object storage tương thích S3 (Console tại cổng `9001`).
  - **Redis**: Caching (Cổng `6379`).

## 3. Cách chạy dự án

### Bước 1: Mở terminal tại thư mục gốc của dự án

Đảm bảo bạn đang đứng tại thư mục chứa file `docker-compose.yml`.

```bash
cd /đường/dẫn/tới/Project/DATN-datn
```

### Bước 2: Build và chạy các container

Chạy lệnh sau để Docker tự động build images và khởi động các services:

```bash
docker-compose up -d --build
```

- `-d`: Chạy ngầm (detached mode).
- `--build`: Buộc build lại các image nếu có thay đổi trong code.

### Bước 3: Kiểm tra trạng thái

Sau khi lệnh chạy xong, bạn có thể kiểm tra danh sách các container đang chạy bằng lệnh:

```bash
docker-compose ps
```

Hoặc xem logs của một service cụ thể (ví dụ frontend):

```bash
docker-compose logs -f frontend
```

## 4. Truy cập ứng dụng

Sau khi khởi động thành công, bạn có thể truy cập các dịch vụ qua trình duyệt:

- **Web App (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **MinIO Console (File Storage)**: [http://localhost:9001](http://localhost:9001)
  - User: `minioadmin`
  - Password: `minioadmin`
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672)
  - User: `guest`
  - Password: `guest`

## 5. Dừng dự án

Để dừng và xóa các container (dữ liệu trong volumes vẫn được giữ lại):

```bash
docker-compose down
```

Để dừng và xóa **cả volumes dữ liệu** (cẩn thận, sẽ mất dữ liệu DB):

```bash
docker-compose down -v
```

## 6. Các lưu ý quan trọng

- **Cổng (Ports)**: Đảm bảo các cổng `3000-3007`, `5432`, `6379`, `9000-9001`, `5672`, `15672` không bị chiếm dụng bởi ứng dụng khác trên máy của bạn.
- **MinIO Buckets**: Container `createbuckets` sẽ tự động chạy để tạo các bucket cần thiết (`video`, `tempvideo`, `background`, `backups`) khi khởi động lần đầu.
- **Backend Hot-reload**: Hiện tại cấu hình Docker đang dùng để chạy production/staging mode. Nếu muốn dev, nên chạy các service cục bộ bằng `npm run dev` để có tính năng hot-reload nhanh hơn.
