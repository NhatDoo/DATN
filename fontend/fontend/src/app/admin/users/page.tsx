"use client";

import { useEffect, useState } from "react";
import "../../globals.css";
import Navbar from "../../components/AdminNavbar";
import Hero from "../../components/Herowrap";
import Footer from "@/app/components/Footer";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  is_banned: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const toggleBan = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !currentStatus }),
      });

      if (!res.ok) throw new Error("Lỗi cập nhật trạng thái!");

      // cập nhật lại UI ngay mà không cần load lại trang
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_banned: !currentStatus } : u
        )
      );
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật trạng thái user");
    }
  };

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách user:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );

  return (
    <div className="container py-5">
      <Hero background="/images/bg_2.jpg" />
      <Navbar />

      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 className="display-6 fw-bold text-primary">Danh sách người dùng</h1>
        <button
          className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2 no-print"
          onClick={() => window.print()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          In danh sách
        </button>
      </div>

      <div className="card-premium border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table-premium align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Email</th>
                  <th>Họ tên</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="text-end pe-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="ps-4 fw-medium">{user.email}</td>
                    <td>{user.full_name || "—"}</td>
                    <td>
                      <span className={`badge ${user.role === 'instructor' ? 'badge-soft-primary' : 'badge-soft-success'}`}>
                        {user.role === 'instructor' ? 'Giảng viên' : 'Học viên'}
                      </span>
                    </td>
                    <td className="text-muted">{new Date(user.created_at).toLocaleDateString("vi-VN")}</td>
                    <td>
                      {user.is_banned ? (
                        <span className="badge badge-soft-danger">Đã khóa</span>
                      ) : (
                        <span className="badge badge-soft-success">Hoạt động</span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <button
                        className={`btn btn-sm ${user.is_banned ? "btn-success" : "btn-outline-danger"}`}
                        onClick={() => {
                          const actionText = user.is_banned ? "mở khóa" : "khóa";
                          if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) {
                            toggleBan(user.id, user.is_banned);
                          }
                        }}
                      >
                        {user.is_banned ? "Mở khóa" : "Khóa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
