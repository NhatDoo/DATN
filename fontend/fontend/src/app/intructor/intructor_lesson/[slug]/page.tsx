"use client";
import { useEffect, useState } from "react";
import Head from "next/head";
import Navbar from "../../../components/Intructernavbar";
import Footer from "../../../components/Footer";
import Loader from "../../../components/Loader";
import Hero from "../../../components/Herowrap";
import "../../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { checkIsBanned } from '@/app/ultis/checkbanned';

export default function NewLessonPage() {
  const router = useRouter();
  const { slug } = useParams();
  const [checkingNSFW, setCheckingNSFW] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    order_idx: 0,
    duration_seconds: 0,
    media_url: "",
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [tempFolder, setTempFolder] = useState("");
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    checkIsBanned();
    if (typeof window !== "undefined") {
      const hasReloaded = sessionStorage.getItem("hasReloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("hasReloaded", "true");
        window.location.reload();
      } else {
        sessionStorage.removeItem("hasReloaded");
      }
    }
  }, []);

  function parseFolderFromUrl(url?: string) {
    if (!url) return "";
    const match = url.match(/temp-stream\/([^/]+)\/playlist\.m3u8$/);
    return match ? match[1] : "";
  }

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch(`http://localhost:3001/lessions/draft/${slug}`);
        if (!res.ok) return;
        const draft = await res.json();
        if (draft) {
          setForm({
            title: draft.title || "",
            content: draft.content || "",
            order_idx: draft.order_idx || 0,
            duration_seconds: draft.duration_seconds || 0,
            media_url: draft.media_url || "",
          });
          setPreviewUrl(draft.temp_media_url || "");
          setTempFolder(draft.temp_folder || parseFolderFromUrl(draft.temp_media_url));
          setIsRestored(true);
          console.log("🔄 Đã khôi phục bản nháp:", draft);
        }
      } catch (err) {
        console.warn("Không có bản nháp trước đó.");
      }
    };
    fetchDraft();
  }, [slug]);

  useEffect(() => {
    if (form.title === "" && form.content === "" && !tempFolder) return;
    const timeout = setTimeout(async () => {
      try {
        await fetch(`http://localhost:3001/lessions/draft/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, temp_media_url: previewUrl, temp_folder: tempFolder }),
        });
        console.log("💾 Auto-saved draft");
      } catch (err) {
        console.warn("⚠️ Lưu bản nháp thất bại:", err);
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [form, slug, previewUrl, tempFolder]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3009/upload/temp", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload thất bại!");
      const data = await res.json();

      setPreviewUrl(data.playlistUrl);
      setTempFolder(data.folderName);

      await fetch(`http://localhost:3001/lessions/draft/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_media_url: data.playlistUrl,
          temp_folder: data.folderName,
          duration_seconds: data.duration,
        }),
      });

      alert("✅ Upload video tạm thành công!");
      setForm((prev) => ({ ...prev, duration_seconds: data.duration }));

    } catch (err) {
      console.error(err);
      alert("❌ Upload thất bại!");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });

        const user = await res.json();

        if (user.role !== "instructor") {
          alert("Bạn không có quyền truy cập trang này!");
          router.push("/login");
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/login");
        router.refresh();
      }
    };

    checkRole();
  }, []);

  const handlePublish = async () => {
    if (!tempFolder) {
      alert("❗ Vui lòng upload video trước khi đăng!");
      return;
    }

    try {
      setCheckingNSFW(true);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (!file) {
        alert("File upload không tồn tại!");
        setCheckingNSFW(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const checkRes = await fetch("http://localhost:3007/check_nsfw", {
        method: "POST",
        body: formData,
      });

      const checkData = await checkRes.json();
      setCheckingNSFW(false);

      if (checkData.is_nsfw) {
        console.warn("⚠️ Video chứa nội dung nhạy cảm:", checkData);
        alert("🚫 Video chứa nội dung không phù hợp. Không thể đăng bài!");
        return;
      }

      setUploading(true);
      const res = await fetch(`http://localhost:3009/upload/publish/${tempFolder}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Không thể publish video!");
      const data = await res.json();

      const payload = {
        ...form,
        media_url: data.folderName || tempFolder,
        status: "published",
        duration_seconds: form.duration_seconds,
        temp_media_url: null,
        temp_folder: null,
      };

      const res2 = await fetch(`http://localhost:3001/lessions/publish/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res2.ok) throw new Error("Không thể cập nhật bài học!");
      alert("🎉 Bài học đã được xuất bản thành công!");
      router.push(`/intructor/${slug}`);

    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi publish bài học!");
    } finally {
      setCheckingNSFW(false);
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Thêm Bài Học Mới - StudyLab Instructor</title>
        <meta name="description" content="Tạo bài học mới cho khóa học của bạn" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-container {
          animation: fadeIn 0.6s ease-out;
        }

        .video-preview {
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s ease;
        }

        .video-preview:hover {
          transform: scale(1.02);
        }

        .upload-area {
          border: 2px dashed #667eea;
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
        }

        .upload-area:hover {
          border-color: #764ba2;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }
      `}</style>

      <main role="main">
        <Navbar />
        <Hero background="/images/bg_2.jpg" />

        <section className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Header */}
              <div className="text-center mb-5 form-container">
                <h1 className="display-5 fw-bold mb-3" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  📝 Thêm Bài Học Mới
                </h1>
                <p className="lead text-muted">Tạo nội dung học tập chất lượng cao cho học viên</p>
                {isRestored && (
                  <div className="alert alert-info" role="alert">
                    <strong>🔄 Đã khôi phục bản nháp</strong> - Tiếp tục chỉnh sửa bài học của bạn
                  </div>
                )}
              </div>

              {/* Form Card */}
              <div className="card border-0 shadow-lg form-container" style={{ borderRadius: '20px' }}>
                <div className="card-body p-4 p-md-5">
                  {/* Title Input */}
                  <div className="mb-4">
                    <label htmlFor="lesson-title" className="form-label fw-bold">
                      Tiêu đề bài học <span className="text-danger">*</span>
                    </label>
                    <input
                      id="lesson-title"
                      className="form-control form-control-lg"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Nhập tiêu đề bài học..."
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  {/* Content Textarea */}
                  <div className="mb-4">
                    <label htmlFor="lesson-content" className="form-label fw-bold">
                      Nội dung bài học
                    </label>
                    <textarea
                      id="lesson-content"
                      className="form-control"
                      rows={5}
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Mô tả chi tiết về bài học..."
                      style={{ borderRadius: '12px' }}
                    />
                  </div>

                  {/* Video Upload */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">
                      🎥 Video bài học <span className="text-danger">*</span>
                    </label>
                    <div className="upload-area">
                      <input
                        type="file"
                        accept="video/*"
                        className="form-control"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                        style={{ borderRadius: '10px' }}
                      />
                      {tempFolder && (
                        <div className="mt-3">
                          <span className="badge bg-success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                            ✓ Video đã upload: <strong>{tempFolder}</strong>
                          </span>
                        </div>
                      )}
                      {!tempFolder && (
                        <p className="text-muted mt-3 mb-0">
                          <small>Hỗ trợ: MP4, AVI, MOV, MKV (Tối đa 500MB)</small>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Video Preview */}
                  {previewUrl && (
                    <div className="mb-4">
                      <label className="form-label fw-bold">Xem trước video</label>
                      <div className="video-preview">
                        <video
                          controls
                          width="100%"
                          src={previewUrl}
                          style={{ display: 'block' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {(uploading || checkingNSFW) && (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted fw-bold">
                        {checkingNSFW
                          ? "🔍 Đang kiểm tra nội dung video..."
                          : "📤 Đang upload video..."}
                      </p>
                      <small className="text-muted">Vui lòng chờ trong giây lát...</small>
                    </div>
                  )}

                  {/* Publish Button */}
                  <button
                    className="btn btn-gradient btn-lg w-100 text-white fw-bold mt-4"
                    onClick={handlePublish}
                    disabled={uploading || !tempFolder || !form.title}
                    style={{
                      borderRadius: '12px',
                      padding: '14px',
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {uploading || checkingNSFW ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>🚀 Đăng Bài Học</>
                    )}
                  </button>

                  {/* Helper Text */}
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      💾 Bản nháp được tự động lưu mỗi 1.5 giây
                    </small>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="row mt-4 g-3">
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                    <div className="card-body text-center">
                      <div style={{ fontSize: '2rem' }}>✍️</div>
                      <h6 className="mt-2 mb-0">Tiêu đề rõ ràng</h6>
                      <small className="text-muted">Giúp học viên hiểu nội dung</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                    <div className="card-body text-center">
                      <div style={{ fontSize: '2rem' }}>🎬</div>
                      <h6 className="mt-2 mb-0">Video chất lượng</h6>
                      <small className="text-muted">HD 720p trở lên</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                    <div className="card-body text-center">
                      <div style={{ fontSize: '2rem' }}>🔒</div>
                      <h6 className="mt-2 mb-0">Kiểm tra NSFW</h6>
                      <small className="text-muted">Tự động lọc nội dung</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: "3rem" }}></div>
        <Footer />
        <Loader />
      </main>
    </>
  );
}
