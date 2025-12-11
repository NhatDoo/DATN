"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState , useEffect } from "react";
import Hero from "../components/Herowrap";
import "../globals.css";
import Footer from "../components/Footer";
import Head from "../components/Head";
import Loader from "@/app/components/Loader";
import Cookies from "js-cookie";

// ✅ Schema xác thực form
const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
type LoginSchema = z.infer<typeof loginSchema>;

export default function Metahead() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  // ✅ Login bằng Google
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  // ✅ Xử lý login thường
const onSubmit = async (data: LoginSchema) => {
  try {
    const res = await fetch("http://localhost:3000/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...data, rememberMe }),
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Đăng nhập thất bại");

    // ⛔ Nếu tài khoản bị ban
    if (resData.is_banned === true) {
      alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ CSKH để được hỗ trợ.");
      return; // dừng login
    }

    // Lưu token
    if (resData.access_token) {
      Cookies.set("access_token", resData.access_token, {
        expires: rememberMe ? 7 : 1,
        path: "/",
      });
    }

    // Điều hướng theo role
    if (resData.is_info_updated === false) {
      router.push("/update-info");
    } else if (resData.role === "student") {
      window.location.href = "/course";
    } else if (resData.role === "instructor") {
      window.location.href = "/intructor";
    } else {
      router.push("/admin");
      router.refresh();
    }

  } catch (err: any) {
    alert(err.message);
  }
};








  return (
    <main>
      <Head />
      <Hero background="/images/bg_1.jpg" />

      <section className="ftco-section ftco-no-pb ftco-no-pt">
        <div className="container">
          <div className="row">
            {/* Cột trái: hình nền / thông tin */}
            <div className="col-md-7"></div>

            {/* Cột phải: form đăng nhập */}
            <div className="col-md-5 order-md-last">
              <div className="login-wrap p-4 p-md-5 shadow-sm bg-white rounded">
                <h3 className="mb-4 text-center">Đăng nhập</h3>

                {/* FORM LOGIN */}
                <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
                  <div className="form-group mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="text"
                      className="form-control"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-danger mt-1 small">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Mật khẩu</label>
                    <input
                      type="password"
                      className="form-control"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-danger mt-1 small">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* ✅ Remember Me (Bootstrap layout đẹp) */}
                  <div className="form-check d-flex align-items-center mb-4">
                    <input
                      type="checkbox"
                      className="form-check-input me-2"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="form-check-label text-secondary"
                      style={{ userSelect: "none" }}
                    >Remember Me
                      {/* Ghi nhớ đăng nhập */}
                    </label>
                  </div>

                  {/* ✅ Nút Login */}
                  <div className="form-group d-flex flex-column align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                    </button>

                    {/* ✅ Nút Login bằng Google */}
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center justify-content-center w-100"
                      onClick={handleGoogleLogin}
                    >
                      <img
                        src="https://www.svgrepo.com/show/355037/google.svg"
                        alt="Google logo"
                        style={{
                          width: "20px",
                          height: "20px",
                          marginRight: "8px",
                        }}
                      />
                      Đăng nhập bằng Google
                    </button>
                  </div>
                </form>

                {/* ✅ Link đăng ký */}
                <p className="text-center mt-4 mb-0">
                  Chưa có tài khoản?{" "}
                  <a href="/register" className="text-primary fw-semibold">
                    Đăng ký ngay
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Loader />
      <Footer />
    </main>
  );
}
