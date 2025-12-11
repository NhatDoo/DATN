"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterSchema } from "../lib/zodschema";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  // Khởi tạo react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      const res = await fetch("http://localhost:3000/users/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Gửi mã OTP thất bại");

      // ✅ chuyển qua trang nhập OTP và pass lại full data của user lên URL hoặc lưu tạm
      window.location.href = `/verify?email=${data.email}&full_name=${data.full_name}&password=${data.password}`;

    } catch (err: any) {
      alert(err.message);
    }
  };


  return (
    <section className="ftco-section ftco-no-pb ftco-no-pt">
      <div className="container">
        <div className="row">
          <div className="col-md-7"></div>
          <div className="col-md-5 order-md-last">
            <div className="login-wrap p-4 p-md-5">
              <h3 className="mb-4">Register Now</h3>

              <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    className="form-control"
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-danger mt-1">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="text"
                    id="email"
                    className="form-control"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-danger mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    className="form-control"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-danger mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-control"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-danger mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div className="form-group d-flex justify-content-end mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
                  </button>
                </div>
              </form>

              <p className="text-center">
                Already have an account?{" "}
                <a href="/login" className="text-primary">
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
