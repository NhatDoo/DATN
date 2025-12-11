"use client";
import Navbar from "../../components/Intructernavbar";
import Hero from "../../components/Herowrap";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Head from "next/head";
import "../../globals.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';

interface Category {
  id: string;
  name: string;
}

export default function NewCoursePage() {
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    price_bigint: 0,
    instructor_id: "",
    background: "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkIsBanned();
    const fetchInstructorId = async () => {
      const userIdFromCookie = Cookies.get("user_id");
      if (userIdFromCookie) {
        setForm((prev) => ({ ...prev, instructor_id: userIdFromCookie }));
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Không thể lấy thông tin giảng viên!");

        const data = await res.json();
        setForm((prev) => ({ ...prev, instructor_id: data.id }));

      } catch (err) {
        console.error("❌ Lỗi instructor_id:", err);
        alert("Không thể xác định giảng viên, hãy đăng nhập lại!");
        window.location.href = "/login";
      }
    };

    fetchInstructorId();
  }, [router]);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });

        const user = await res.json();

        if (user.role !== "instructor") {
          alert("Bạn không có quyền truy cập trang này!");
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        window.location.href = "/login";
      }
    };

    checkRole();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/categories", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Không thể tải danh mục");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
        alert("Không thể tải danh mục. Hãy thử lại sau!");
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "price_bigint" ? parseInt(value) || 0 : value,
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:3009/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload thất bại: ${errText}`);
      }

      const data = await res.json();
      if (!data.imageUrl) throw new Error("Không nhận được URL ảnh từ server!");

      setForm((prev) => ({ ...prev, background: data.imageUrl }));
      alert("✅ Ảnh background đã được tải lên!");
    } catch (err: any) {
      console.error("❌ Lỗi upload:", err);
      alert(err.message || "Upload ảnh thất bại!");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.instructor_id) throw new Error("Không tìm thấy ID giảng viên!");

      const payload = {
        ...form,
        category_ids: selectedCategories,
        instructor_id: form.instructor_id,
      };

      const res = await fetch("http://localhost:3001/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(`Không thể tạo khóa học: ${errData}`);
      }

      const data = await res.json();
      alert("✅ Tạo khóa học thành công!");
      window.location.href = `/intructor/intructor_lesson/${data.slug}`;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi tạo khóa học!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Tạo Khóa Học Mới - StudyLab | Nền Tảng Giáo Dục Trực Tuyến</title>
        <meta name="description" content="Tạo và quản lý khóa học trực tuyến của bạn trên StudyLab" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main role="main">
        <Navbar />
        <Hero background="/images/bg_2.jpg" />

        <section className="container py-5" aria-labelledby="page-title">
          <div className="row justify-content-center">
            <div className="col-md-10 col-lg-8">
              <article
                className="card shadow-lg border-0 overflow-hidden"
                style={{ borderRadius: '20px' }}
              >
                <header
                  className="text-center py-5 px-4"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px 20px 0 0'
                  }}
                >
                  <span
                    className="d-block mb-2 text-white-50 text-uppercase fw-bold"
                    style={{ fontSize: '0.875rem', letterSpacing: '2px' }}
                  >
                    StudyLab Platform
                  </span>
                  <h1
                    id="page-title"
                    className="mb-0 text-white fw-bold"
                    style={{
                      fontSize: '2.5rem',
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    Tạo Khóa Học Mới
                  </h1>
                  <p className="text-white-50 mt-3 mb-0">
                    Chia sẻ kiến thức của bạn với hàng ngàn học viên
                  </p>
                </header>

                <div className="p-4 p-md-5">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="course-title" className="form-label fw-bold">Tiêu đề khóa học</label>
                      <input
                        id="course-title"
                        name="title"
                        className="form-control form-control-lg"
                        value={form.title}
                        onChange={handleChange}
                        required
                        placeholder="Nhập tiêu đề khóa học"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="course-description" className="form-label fw-bold">Mô tả ngắn</label>
                      <textarea
                        id="course-description"
                        name="short_description"
                        className="form-control"
                        value={form.short_description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Mô tả ngắn về khóa học"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="course-price" className="form-label fw-bold">Giá (VND)</label>
                      <input
                        id="course-price"
                        type="number"
                        name="price_bigint"
                        className="form-control form-control-lg"
                        value={form.price_bigint}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="Nhập giá khóa học"
                        style={{ borderRadius: '10px' }}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Danh mục (chọn nhiều)</label>
                      {fetchingCategories ? (
                        <p className="text-muted">Đang tải danh mục...</p>
                      ) : (
                        <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto", borderRadius: '10px' }}>
                          {categories.length === 0 ? (
                            <p className="text-muted">Không có danh mục nào</p>
                          ) : (
                            categories.map((cat) => (
                              <div key={cat.id} className="form-check mb-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`category-${cat.id}`}
                                  checked={selectedCategories.includes(cat.id)}
                                  onChange={() => handleCategoryToggle(cat.id)}
                                />
                                <label className="form-check-label" htmlFor={`category-${cat.id}`}>
                                  {cat.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <small className="text-muted mt-2 d-block">
                          ✓ Đã chọn: {selectedCategories.length} danh mục
                        </small>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="course-background" className="form-label fw-bold">Ảnh nền khóa học</label>
                      <input
                        id="course-background"
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{ borderRadius: '10px' }}
                      />
                      {uploading && (
                        <p className="text-info mt-2">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Đang tải ảnh...
                        </p>
                      )}
                      {form.background && (
                        <div className="mt-3 text-center">
                          <img
                            src={form.background.startsWith("http") ? form.background : `http://localhost:3009/${form.background}`}
                            alt="Preview"
                            className="img-fluid rounded shadow"
                            style={{ maxHeight: "200px", objectFit: "cover", borderRadius: '10px' }}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn w-100 text-white fw-bold py-3"
                      disabled={loading}
                      style={{
                        background: loading ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Đang lưu...
                        </>
                      ) : (
                        "🚀 Tạo Khóa Học"
                      )}
                    </button>
                  </form>
                </div>
              </article>
            </div>
          </div>
        </section>

        <Footer />
        <Loader />
      </main>
    </>
  );
}
