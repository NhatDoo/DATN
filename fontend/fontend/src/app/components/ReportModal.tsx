"use client";
import React, { useState } from 'react';

interface ReportModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => Promise<void>;
}

export default function ReportModal({ show, onClose, onSubmit }: ReportModalProps) {
    const [reason, setReason] = useState('spam');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit(reason, description);
        setLoading(false);
        onClose();
    };

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title font-bold">Báo cáo khóa học</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label font-medium">Lý do</label>
                            <select className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                                <option value="spam">Spam - Spam</option>
                                <option value="inappropriate_content">Nội dung không phù hợp - Inappropriate Content</option>
                                <option value="scam">Lừa đảo - Scam</option>
                                <option value="copyright">Vi phạm bản quyền - Copyright</option>
                                <option value="other">Khác - Other</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label font-medium">Mô tả chi tiết</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập mô tả chi tiết..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button type="button" className="btn btn-danger text-white" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
