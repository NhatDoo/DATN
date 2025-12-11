"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import "../../globals.css";

export default function CouponsManagement() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discount_type: "percent",
        discount_value: 0,
        max_usage: 100,
        valid_from: "",
        valid_to: "",
        active: true
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchCoupons = async () => {
        try {
            const res = await fetch("http://localhost:3002/coupons");
            const data = await res.json();
            setCoupons(data);
        } catch (error) {
            console.error("Lỗi tải coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `http://localhost:3002/coupons/${editingId}`
                : "http://localhost:3002/coupons";

            const method = editingId ? "PATCH" : "POST";

            // Format dates
            const payload = {
                ...formData,
                discount_value: Number(formData.discount_value),
                max_usage: Number(formData.max_usage),
                valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
                valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(editingId ? "Cập nhật thành công!" : "Tạo mới thành công!");
                setShowModal(false);
                fetchCoupons();
                setEditingId(null);
                setFormData({
                    code: "",
                    discount_type: "percent",
                    discount_value: 0,
                    max_usage: 100,
                    valid_from: "",
                    valid_to: "",
                    active: true
                });
            } else {
                alert("Có lỗi xảy ra");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (coupon: any) => {
        setEditingId(coupon.id);
        setFormData({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            max_usage: coupon.max_usage,
            valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : "",
            valid_to: coupon.valid_to ? new Date(coupon.valid_to).toISOString().slice(0, 16) : "",
            active: coupon.active
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa?")) return;
        try {
            await fetch(`http://localhost:3002/coupons/${id}`, { method: "DELETE" });
            fetchCoupons();
        } catch (e) { console.error(e); }
    }

    return (
        <main className="bg-light min-h-screen">
            <AdminNavbar />
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="display-6 fw-bold text-primary">Quản lý Mã Giảm Giá</h2>
                    <button
                        className="btn btn-primary shadow-sm"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                code: "",
                                discount_type: "percent",
                                discount_value: 0,
                                max_usage: 100,
                                valid_from: "",
                                valid_to: "",
                                active: true
                            });
                            setShowModal(true);
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i>+ Tạo Mã Mới
                    </button>
                </div>

                <div className="card border-0 shadow-sm rounded-lg overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="bg-light text-secondary">
                                <tr>
                                    <th className="py-3 ps-4">Code</th>
                                    <th className="py-3">Loại giảm</th>
                                    <th className="py-3">Giá trị</th>
                                    <th className="py-3">Đã dùng</th>
                                    <th className="py-3">Hiệu lực từ</th>
                                    <th className="py-3">Hết hạn</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="py-3 text-end pe-4">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td className="ps-4 fw-bold text-primary">{coupon.code}</td>
                                        <td>
                                            <span className={`badge ${coupon.discount_type === 'percent' ? 'bg-info' : 'bg-warning'} text-dark`}>
                                                {coupon.discount_type === 'percent' ? 'Phần trăm' : 'Số tiền'}
                                            </span>
                                        </td>
                                        <td className="fw-bold">
                                            {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()} đ`}
                                        </td>
                                        <td>{coupon.usage_count} / {coupon.max_usage}</td>
                                        <td>{new Date(coupon.valid_from).toLocaleDateString("vi-VN")}</td>
                                        <td>{coupon.valid_to ? new Date(coupon.valid_to).toLocaleDateString("vi-VN") : "Vô thời hạn"}</td>
                                        <td>
                                            <span className={`badge ${coupon.active ? 'bg-success' : 'bg-secondary'}`}>
                                                {coupon.active ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleEdit(coupon)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(coupon.id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {coupons.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5 text-muted">Chưa có mã giảm giá nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">
                                    {editingId ? "Cập nhật Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Mã Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Loại giảm giá</label>
                                            <select
                                                className="form-select"
                                                value={formData.discount_type}
                                                onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                            >
                                                <option value="percent">Phần trăm (%)</option>
                                                <option value="fixed">Số tiền cố định (VND)</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Giá trị giảm</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.discount_value}
                                                onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Giới hạn sử dụng</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.max_usage}
                                            onChange={e => setFormData({ ...formData, max_usage: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Hiệu lực từ</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={formData.valid_from}
                                                onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Đến ngày (Để trống nếu vô thời hạn)</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={formData.valid_to}
                                                onChange={e => setFormData({ ...formData, valid_to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="activeSwitch"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="activeSwitch">Đang hoạt động</label>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold">Lưu Coupon</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
