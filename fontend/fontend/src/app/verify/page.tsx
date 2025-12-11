"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
// ✅ Import Bootstrap SAU globals.css
import "../globals.css";

export default function VerifyOTPPage() {
  const search = useSearchParams();
  const router = useRouter();

  const email = search.get("email") || "";
  const full_name = search.get("full_name") || "";
  const password = search.get("password") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) {
      alert("Vui lòng nhập mã OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name,
          code: otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xác thực OTP thất bại");

      alert("✅ Tạo tài khoản thành công!");
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ftco-section ftco-no-pb ftco-no-pt bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow p-4 p-md-5">
              <h3 className="text-center mb-4">Nhập mã OTP</h3>

              <p className="text-center mb-3">
                Email xác minh: <strong>{email}</strong>
              </p>

              <div className="form-group mb-3">
                <label htmlFor="otp" className="form-label">Mã OTP</label>
                <input
                  id="otp"
                  type="text"
                  className="form-control"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập mã gồm 6 số"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleVerify}
                className="btn btn-primary w-100 py-2"
                disabled={loading}
              >
                {loading ? "🔄 Đang xác minh..." : "Xác nhận OTP"}
              </button>

              <p className="text-center text-muted mt-3 mb-0">
                Mã OTP hết hạn sau <strong>5 phút</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
