'use client';

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import Script from 'next/script';
import "../globals.css";
import Navbar from "../components/AdminNavbar"
import Footer from "../components/Footer";

import Hero from "../components/Herowrap";

// Đăng ký Chart.js
ChartJS.register(ArcElement, Tooltip);

export default function AdminDashboard() {
  const [userData, setUserData] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await fetch("http://localhost:3000/users").then(r => r.json());
        const courses = await fetch("http://localhost:3001/course").then(r => r.json());

        setUserData(users);
        setCourseData(courses);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Khởi tạo AOS sau khi component mount
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      // AOS sẽ tự init khi script load
      const AOS = (window as any).AOS;
      if (AOS) {
        setTimeout(() => AOS.refresh(), 100);
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />
        <div className="container-fluid py-5 min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden"></span>
            </div>
            <p className="mt-3 fs-4 text-muted">Đang tải thống kê...</p>
          </div>
        </div>
      </>
    );
  }

  const instructors = userData.filter(u => u.role === "instructor").length;
  const students = userData.filter(u => u.role === "student").length;
  const totalUsers = userData.length;

  const pieData = {
    labels: ["Giảng viên", "Học viên"],
    datasets: [{
      data: [instructors, students],
      backgroundColor: ["#9febc8ff", "#6ad3c7ff"],
      borderColor: "#fff",
      borderWidth: 2,
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} người (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <>
      {/* Bootstrap CSS */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-9ndCyUa6mI4Tfulk9T9x3t7L3C8jo8g3k3i42083u3k3l3r3r3r3r3r3r3r3r3r3r"
        crossOrigin="anonymous"
      />

      {/* AOS CSS + JS */}
      <link href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css" rel="stylesheet" />
      <Script
        src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"
        onLoad={() => {
          (window as any).AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50,
          });
        }}
      />
      <Hero background="/images/bg_2.jpg" />
      <Navbar />

      <div className="container-fluid py-5">
        <h1 className="display-5 fw-bold text-center mb-5 text-primary" data-aos="fade-down">
          Admin Dashboard
        </h1>

        <div className="d-flex justify-content-center mb-5 no-print" data-aos="fade-up">
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2"
            onClick={() => window.print()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            In báo cáo
          </button>
        </div>

        <div className="row g-5">

          {/* === BÊN TRÁI: Biểu đồ === */}
          <div className="col-lg-4 d-flex justify-content-center">
            <div
              className="card-premium w-100"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="card-body text-center p-4">
                <h5 className="card-title fw-bold text-dark mb-4">Tỉ lệ người dùng</h5>
                <div className="d-flex justify-content-center mb-4">
                  <div style={{ width: '220px', height: '220px' }}>
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-4">
                  <div className="text-center">
                    <span className="d-block rounded-circle mx-auto mb-2" style={{ width: '12px', height: '12px', backgroundColor: '#9febc8ff' }}></span>
                    <small className="text-muted d-block">Giảng viên</small>
                    <span className="fw-bold fs-5">{instructors}</span>
                  </div>
                  <div className="text-center">
                    <span className="d-block rounded-circle mx-auto mb-2" style={{ width: '12px', height: '12px', backgroundColor: '#6ad3c7ff' }}></span>
                    <small className="text-muted d-block">Học viên</small>
                    <span className="fw-bold fs-5">{students}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === BÊN PHẢI: Các số liệu === */}
          <div className="col-lg-8">
            <div className="row g-4">

              {/* Tổng người dùng */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="200">
                <div className="card-premium h-100 bg-gradient-ocean text-white border-0">
                  <div className="card-body d-flex flex-column justify-content-center p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title fw-semibold mb-0">Tổng người dùng</h5>
                      <i className="flaticon-user fs-3 opacity-50"></i>
                    </div>
                    <p className="display-4 fw-bold mb-0">{totalUsers}</p>
                    <small className="opacity-75">Thành viên hoạt động</small>
                  </div>
                </div>
              </div>

              {/* Tổng giảng viên */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="300">
                <div className="card-premium h-100 bg-gradient-mint text-white border-0">
                  <div className="card-body d-flex flex-column justify-content-center p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title fw-semibold mb-0 text-dark">Tổng giảng viên</h5>
                      <i className="flaticon-teacher fs-3 text-dark opacity-50"></i>
                    </div>
                    <p className="display-4 fw-bold mb-0 text-dark">{instructors}</p>
                    <small className="text-dark opacity-75">Đối tác giảng dạy</small>
                  </div>
                </div>
              </div>

              {/* Tổng học viên */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="400">
                <div className="card-premium h-100 bg-gradient-sunset text-white border-0">
                  <div className="card-body d-flex flex-column justify-content-center p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title fw-semibold mb-0 text-dark">Tổng học viên</h5>
                      <i className="flaticon-student fs-3 text-dark opacity-50"></i>
                    </div>
                    <p className="display-4 fw-bold mb-0 text-dark">{students}</p>
                    <small className="text-dark opacity-75">Đang theo học</small>
                  </div>
                </div>
              </div>

              {/* Tổng khóa học */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="500">
                <div className="card-premium h-100 bg-gradient-purple text-white border-0">
                  <div className="card-body d-flex flex-column justify-content-center p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="card-title fw-semibold mb-0">Tổng khóa học</h5>
                      <i className="flaticon-book fs-3 opacity-50"></i>
                    </div>
                    <p className="display-4 fw-bold mb-0">{courseData.length}</p>
                    <small className="opacity-75">Khóa học chất lượng</small>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}