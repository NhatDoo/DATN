"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import "../globals.css";

interface User {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  role: string;
}

export default function ProfilePage() {
  const [step, setStep] = useState<number>(1);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "",
  });

  // ✅ Kiểm tra token (vẫn cần để chắc chắn có cookie)
  // useEffect(() => {
  //   const tokenFromUrl = new URLSearchParams(window.location.search).get("token");
  //   if (tokenFromUrl) {
  //     Cookies.set("token", tokenFromUrl, {
  //       path: "/",
  //       sameSite: "lax",
  //       secure: false,
  //       expires: 7,
  //     });
  //     window.history.replaceState({}, document.title, window.location.pathname);
  //   } else {
  //     const token = Cookies.get("token");
  //     if (!token) {
  //       alert("Bạn cần đăng nhập!");
  //       router.push("/login");
  //     }
  //   }
  // }, [router]);

  // ✅ Lấy thông tin user (bằng cookie, không cần Authorization header)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          method: "GET",
          credentials: "include", // 👈 gửi cookie JWT tự động
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: User = await res.json();

        setUser(data);
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "",
        });
      } catch (err) {
        console.error("❌ Lỗi khi load user:", err);
        alert("Không thể tải thông tin người dùng. Vui lòng đăng nhập lại!");
        Cookies.remove("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // ✅ Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // ✅ Gửi cập nhật user (dùng cookie JWT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user?.id) throw new Error("Không tìm thấy ID người dùng!");

      const res = await fetch(`http://localhost:3000/users/${user.id}`, {
        method: "PUT",
        credentials: "include", // 👈 quan trọng
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, is_info_updated: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại!");

      alert("✅ Cập nhật thành công!");
      router.push("/course");
    } catch (err: any) {
      console.error("❌ Lỗi khi cập nhật:", err);
      alert(err.message || "Đã xảy ra lỗi!");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );

  return (
    <main className="container mt-5">
      <div className="card shadow p-4 animate__animated animate__fadeIn">
        <h3 className="text-center mb-4">Cập nhật thông tin cá nhân</h3>

        {/* Progress */}
        <div className="progress mb-4">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{ width: step === 1 ? "50%" : "100%" }}
          >
            {step === 1 ? "Bước 1 / 2" : "Bước 2 / 2"}
          </div>
        </div>

        {/* Bước 1: chọn vai trò */}
        {step === 1 && (
          <div className="text-center animate__animated animate__fadeInUp">
            <h5 className="mb-4">Chọn vai trò của bạn</h5>
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              {["student", "instructor"].map((role) => (
                <div
                  key={role}
                  className={`card text-center ${form.role === role ? "border-primary shadow-lg" : ""}`}
                  style={{ width: "16rem", cursor: "pointer", transition: "0.3s" }}
                  onClick={() => setForm({ ...form, role })}
                >
                  <div className="card-body">
                    <h5 className="card-title">
                      {role === "student" ? "Học viên" : "Giảng viên"}
                    </h5>
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange}
                      className="form-check-input mt-2"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary w-100 mt-4"
              disabled={!form.role}
              onClick={nextStep}
            >
              Tiếp tục
            </button>
          </div>
        )}

        {/* Bước 2: Nhập thông tin */}
        {step === 2 && (
          <div className="animate__animated animate__fadeIn">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Họ và tên</label>
                <input
                  type="text"
                  name="full_name"
                  className="form-control"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-control" value={form.email} disabled />
              </div>

              <div className="mb-3">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                  Quay lại
                </button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? "Đang lưu..." : "Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
