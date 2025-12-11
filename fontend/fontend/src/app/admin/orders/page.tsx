"use client";

import { useEffect, useState } from "react";
import "../../globals.css";
import Navbar from "../../components/AdminNavbar";
import Hero from "../../components/Herowrap";
import Footer from "@/app/components/Footer";

interface Order {
    id: string;
    user_id: string;
    total_amount_bigint: string; // BigInt usually comes as string in JSON
    status: string;
    created_at: string;
}

interface Transaction {
    id: string;
    payment_id: string;
    type: string;
    amount_bigint: string;
    status: string;
    created_at: string;
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<"orders" | "transactions">("orders");
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersRes, transactionsRes] = await Promise.all([
                    fetch("http://localhost:3002/orders"),
                    fetch("http://localhost:3002/payment-transactions")
                ]);

                const ordersData = await ordersRes.json();
                const transactionsData = await transactionsRes.json();

                setOrders(ordersData);
                setTransactions(transactionsData);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'success':
                return 'badge-soft-success';
            case 'pending':
                return 'badge-soft-primary';
            case 'failed':
            case 'canceled':
                return 'badge-soft-danger';
            default:
                return 'badge-soft-primary';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
            case 'success':
                return 'Thành công';
            case 'pending':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
            case 'canceled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    if (loading)
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden"></span>
                </div>
            </div>
        );

    return (
        <div className="container py-5">
            <Hero background="/images/bg_2.jpg" />
            <Navbar />

            <div className="d-flex justify-content-between align-items-center mb-5">
                <h1 className="display-6 fw-bold text-primary">Quản lý Đơn hàng & Giao dịch</h1>
                <button
                    className="btn btn-outline-primary d-flex align-items-center gap-2 px-4 py-2 no-print"
                    onClick={() => window.print()}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    In danh sách
                </button>
            </div>

            {/* Tabs */}
            <div className="d-flex gap-3 mb-4 no-print">
                <button
                    className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-primary'} px-4 py-2 rounded-pill fw-semibold`}
                    onClick={() => setActiveTab('orders')}
                >
                    Đơn hàng
                </button>
                <button
                    className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-outline-primary'} px-4 py-2 rounded-pill fw-semibold`}
                    onClick={() => setActiveTab('transactions')}
                >
                    Giao dịch
                </button>
            </div>

            <div className="card-premium border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        {activeTab === 'orders' ? (
                            <table className="table-premium align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Mã đơn hàng</th>
                                        <th>Người dùng (ID)</th>
                                        <th>Tổng tiền</th>
                                        <th>Ngày tạo</th>
                                        <th className="text-end pe-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">Chưa có đơn hàng nào.</td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id}>
                                                <td className="ps-4 fw-medium text-primary">#{order.id.slice(0, 8)}...</td>
                                                <td className="text-muted">{order.user_id}</td>
                                                <td className="fw-bold text-dark">{formatCurrency(order.total_amount_bigint)}</td>
                                                <td className="text-muted">{new Date(order.created_at).toLocaleDateString("vi-VN")}</td>
                                                <td className="text-end pe-4">
                                                    <span className={`badge ${getStatusBadge(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="table-premium align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Mã giao dịch</th>
                                        <th>Loại</th>
                                        <th>Số tiền</th>
                                        <th>Ngày tạo</th>
                                        <th className="text-end pe-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-5 text-muted">Chưa có giao dịch nào.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((trans) => (
                                            <tr key={trans.id}>
                                                <td className="ps-4 fw-medium text-primary">#{trans.id.slice(0, 8)}...</td>
                                                <td className="text-uppercase">{trans.type}</td>
                                                <td className="fw-bold text-dark">{formatCurrency(trans.amount_bigint)}</td>
                                                <td className="text-muted">{new Date(trans.created_at).toLocaleDateString("vi-VN")}</td>
                                                <td className="text-end pe-4">
                                                    <span className={`badge ${getStatusBadge(trans.status)}`}>
                                                        {getStatusText(trans.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
