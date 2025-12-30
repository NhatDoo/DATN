'use client';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import "../../globals.css"
import Navbar from "../../components/AdminNavbar";
import Footer from "../../components/Footer";
import Hero from "../../components/Herowrap";
import Script from 'next/script';
import "../../globals.css";

// Schema validation
const categorySchema = z.object({
    name: z.string().min(1, "Tên danh mục không được để trống"),
    slug: z.string().min(1, "Slug không được để trống"),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    created_at: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
    });

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await axios.get("http://localhost:3001/categories");
            setCategories(response.data);
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle form submit
    const onSubmit = async (data: CategoryFormValues) => {
        try {
            if (isEditing && currentId) {
                await axios.put(`http://localhost:3001/categories/${currentId}`, data);
            } else {
                await axios.post("http://localhost:3001/categories", data);
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error("Lỗi lưu danh mục:", error);
            alert("Có lỗi xảy ra khi lưu danh mục");
        }
    };

    // Delete category
    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                await axios.delete(`http://localhost:3001/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error("Lỗi xóa danh mục:", error);
                alert("Có lỗi xảy ra khi xóa danh mục");
            }
        }
    };

    // Open modal for add
    const handleAdd = () => {
        setIsEditing(false);
        setCurrentId(null);
        reset({ name: "", slug: "", description: "" });
        setShowModal(true);
    };

    // Open modal for edit
    const handleEdit = (category: Category) => {
        setIsEditing(true);
        setCurrentId(category.id);
        setValue("name", category.name);
        setValue("slug", category.slug);
        setValue("description", category.description || "");
        setShowModal(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/([^0-9a-z-\s])/g, "")
            .replace(/(\s+)/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    return (
        <>
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                rel="stylesheet"
                integrity="sha384-9ndCyUa6mI4Tfulk9T9x3t7L3C8jo8g3k3i42083u3k3l3r3r3r3r3r3r3r3r3r3r"
                crossOrigin="anonymous"
            />
            <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" />

            <Hero background="/images/bg_2.jpg" />
            <Navbar />

            <div className="container py-5 min-vh-100">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="display-6 fw-bold text-primary">Quản lý Danh mục</h1>
                    <div className="d-flex gap-2 no-print">
                        <button
                            className="btn btn-outline-primary shadow-sm d-flex align-items-center gap-2"
                            onClick={() => window.print()}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            In danh sách
                        </button>
                        <button className="btn btn-primary shadow-sm" onClick={handleAdd}>
                            <i className="bi bi-plus-lg me-2"></i>Thêm Danh mục
                        </button>
                    </div>
                </div>

                <div className="card-premium border-0">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table-premium align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 ps-4">Tên danh mục</th>
                                        <th className="py-3">Slug</th>
                                        <th className="py-3">Mô tả</th>
                                        <th className="py-3 text-end pe-4">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden"></span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-5 text-muted">
                                                Chưa có danh mục nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr key={category.id}>
                                                <td className="ps-4 fw-semibold">{category.name}</td>
                                                <td className="text-muted">{category.slug}</td>
                                                <td>{category.description || "-"}</td>
                                                <td className="text-end pe-4">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => handleEdit(category)}
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(category.id)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header bg-primary text-white rounded-top-4">
                                <h5 className="modal-title fw-bold">{isEditing ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Tên danh mục</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.name ? "is-invalid" : ""}`}
                                            {...register("name")}
                                            onChange={(e) => {
                                                setValue("name", e.target.value);
                                                if (!isEditing) {
                                                    setValue("slug", generateSlug(e.target.value));
                                                }
                                            }}
                                        />
                                        {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Slug</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.slug ? "is-invalid" : ""}`}
                                            {...register("slug")}
                                        />
                                        {errors.slug && <div className="invalid-feedback">{errors.slug.message}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Mô tả</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            {...register("description")}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light rounded-bottom-4">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary px-4">{isEditing ? "Cập nhật" : "Thêm mới"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
