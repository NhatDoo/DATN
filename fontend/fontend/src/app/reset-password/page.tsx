"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // lấy token từ URL

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage("❌ Token không hợp lệ hoặc đã hết hạn");
      return;
    }

    if (password !== confirm) {
      setMessage("❌ Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.");
      } else {
        setMessage("❌ " + (data.message || "Đã xảy ra lỗi."));
      }
    } catch (error) {
      setMessage("⚠️ Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">
          🔑 Đặt lại mật khẩu
        </h1>

        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded-md p-2 w-full mb-3"
          required
        />

        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border rounded-md p-2 w-full mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full p-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
