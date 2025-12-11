"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Herowrap_cart";
import Footer from "../components/Footer";
import "../globals.css";
import Loader from "../components/Loader";

export default function CartClient() {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    // 🛒 Lấy giỏ hàng
    const fetchCart = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:3002/order-items/by-user", {
                credentials: "include",
            });

            const orderItems = await res.json();

            if (!Array.isArray(orderItems)) {
                console.error("❌ Dữ liệu trả về không phải mảng:", orderItems);
                return;
            }

            // 👉 Gọi thêm thông tin khóa học cho từng item
            const detailedItems = await Promise.all(
                orderItems.map(async (item: any) => {
                    try {
                        const courseRes = await fetch(
                            `http://localhost:3001/course/${item.course_id}`
                        );
                        const course = await courseRes.json();
                        return { ...item, course };
                    } catch (err) {
                        console.error("⚠️ Lỗi lấy khóa học:", err);
                        return item;
                    }
                })
            );

            // Lưu lại danh sách có chi tiết
            setCartItems(detailedItems);

            // Tính tổng tiền
            const totalAmount = detailedItems.reduce(
                (acc: number, item: any) => acc + (Number(item.price_bigint) || 0),
                0
            );
            setSubtotal(totalAmount);

            // Lấy thông tin order hiện tại để check coupon
            try {
                const orderRes = await fetch("http://localhost:3002/orders/current", {
                    credentials: "include",
                });
                const order = await orderRes.json();
                if (order && order.id) {
                    setOrderId(order.id);
                    if (order.coupon_id) {
                        // Nếu có coupon, cập nhật discount và total từ order
                        // Tuy nhiên backend trả về bigint, cần convert
                        const disc = Number(order.discount_amount_bigint) || 0;
                        setDiscount(disc);
                        setAppliedCoupon("Đã áp dụng"); // Hoặc fetch code nếu cần
                        setTotal(Number(order.total_amount_bigint) || (totalAmount - disc));
                    } else {
                        setTotal(totalAmount);
                        setDiscount(0);
                        setAppliedCoupon(null);
                    }
                } else {
                    setTotal(totalAmount);
                }
            } catch (e) {
                console.error("Lỗi lấy order:", e);
                setTotal(totalAmount);
            }

        } catch (err) {
            console.error("❌ Lỗi khi tải giỏ hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // 🗑️ Xóa khóa học khỏi giỏ
    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa khóa học này khỏi giỏ hàng?")) return;

        try {
            const res = await fetch(`http://localhost:3002/order-items/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                alert("Đã xóa khóa học khỏi giỏ hàng!");
                fetchCart();
            } else {
                alert("Không thể xóa khóa học!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi xóa khóa học:", error);
        }
    };

    // 🎟️ Áp dụng mã giảm giá
    const handleApplyCoupon = async () => {
        if (!couponCode || !orderId) return;
        try {
            const res = await fetch("http://localhost:3002/orders/apply-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId, code: couponCode }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Áp dụng mã giảm giá thành công!");
                setDiscount(Number(data.discount_amount_bigint));
                setTotal(Number(data.total_amount_bigint));
                setAppliedCoupon(couponCode);
            } else {
                alert(data.message || "Mã giảm giá không hợp lệ");
            }
        } catch (e) {
            console.error("Lỗi áp dụng coupon:", e);
            alert("Lỗi khi áp dụng mã giảm giá");
        }
    };

    // ❌ Hủy mã giảm giá
    const handleRemoveCoupon = async () => {
        if (!orderId) return;
        try {
            const res = await fetch("http://localhost:3002/orders/remove-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Đã hủy mã giảm giá");
                setDiscount(0);
                setTotal(Number(data.total_amount_bigint));
                setAppliedCoupon(null);
                setCouponCode("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 💳 Thanh toán VNPay
    const handleCheckout = async () => {
        try {
            const orderRes = await fetch("http://localhost:3002/orders/current", {
                credentials: "include",
            });
            const order = await orderRes.json();

            if (!order?.id) {
                alert("Không tìm thấy đơn hàng hiện tại!");
                return;
            }

            const res = await fetch(
                `http://localhost:3002/vnpay-payments/create?amount=${total}&orderInfo=Thanh+toan+gio+hang&orderId=${order.id}`,
                { credentials: "include" }
            );

            const data = await res.json();

            if (data.success && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                alert("Không thể tạo URL thanh toán!");
            }
        } catch (error) {
            console.error("❌ Lỗi thanh toán:", error);
        }
    };

    return (
        <main>
            <Hero background="/images/bg_2.jpg" />
            <Navbar />

            <section className="ftco-section ftco-cart" style={{ padding: "6rem 0", backgroundColor: "#f8f9fa" }}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-12 mb-5 text-center">
                            <h2 className="h2 font-weight-bold text-primary">🛍️ Giỏ hàng của bạn</h2>
                            <p className="text-muted">Xem lại các khóa học bạn đã chọn và tiến hành thanh toán</p>
                        </div>
                    </div>

                    {loading ? (
                        <Loader />
                    ) : cartItems.length === 0 ? (
                        <div className="row justify-content-center">
                            <div className="col-md-6 text-center py-5">
                                <div className="mb-4">
                                    <i className="fa fa-shopping-cart fa-5x text-muted opacity-25"></i>
                                </div>
                                <h4 className="mb-3">Giỏ hàng của bạn đang trống</h4>
                                <p className="text-muted mb-4">Hãy tìm kiếm khóa học phù hợp để bắt đầu hành trình học tập ngay hôm nay!</p>
                                <a href="/course" className="btn btn-primary py-3 px-5 rounded-pill shadow-sm">
                                    Khám phá khóa học
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="row">
                            {/* Left Column: Cart Items */}
                            <div className="col-lg-8 mb-4">
                                <div className="card border-0 shadow-sm rounded-lg overflow-hidden">
                                    <div className="card-header bg-white border-bottom py-3">
                                        <h5 className="mb-0 font-weight-bold">Khóa học ({cartItems.length})</h5>
                                    </div>
                                    <div className="card-body p-0">
                                        {cartItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="d-flex align-items-center p-4 border-bottom hover-bg-light transition-all"
                                                style={{ transition: "0.3s" }}
                                            >
                                                {/* Image */}
                                                <div className="flex-shrink-0 mr-4">
                                                    <div
                                                        className="rounded overflow-hidden bg-light"
                                                        style={{ width: "120px", height: "80px", backgroundImage: `url(${item.course?.background || '/images/course-1.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                                    ></div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1 font-weight-bold text-dark">
                                                        <a href={`/course/${item.course?.slug}`} className="text-decoration-none text-dark hover-primary">
                                                            {item.course?.title || "Khóa học không xác định"}
                                                        </a>
                                                    </h5>
                                                    <p className="mb-1 text-muted small">
                                                        Giảng viên: {item.course?.instructor?.full_name || "StudyLab"}
                                                    </p>
                                                    <div className="d-flex align-items-center mt-2">
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="btn btn-link text-danger p-0 text-decoration-none small"
                                                        >
                                                            <i className="fa fa-trash mr-1"></i> Xóa
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right ml-4">
                                                    <span className="h5 font-weight-bold text-primary d-block mb-0">
                                                        {item.price_bigint?.toLocaleString()} đ
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Summary */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm rounded-lg sticky-top" style={{ top: "100px", zIndex: 10 }}>
                                    <div className="card-body p-4">
                                        <h5 className="font-weight-bold mb-4">Tổng quan đơn hàng</h5>

                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Tạm tính</span>
                                            <span className="font-weight-bold">{subtotal.toLocaleString()} đ</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="text-muted">Giảm giá</span>
                                            <span className="text-success">- {discount.toLocaleString()} đ</span>
                                        </div>

                                        {/* Coupon Input */}
                                        <div className="mb-3">
                                            {!appliedCoupon ? (
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Mã giảm giá"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                    />
                                                    <button className="btn btn-outline-primary" onClick={handleApplyCoupon}>
                                                        Áp dụng
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded border">
                                                    <span className="text-success small">
                                                        <i className="fa fa-tag mr-1"></i> Mã: <strong>{appliedCoupon}</strong>
                                                    </span>
                                                    <button className="btn btn-sm btn-link text-danger p-0" onClick={handleRemoveCoupon}>
                                                        &times;
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <hr className="my-3" />

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="h5 font-weight-bold mb-0">Tổng cộng</span>
                                            <span className="h4 font-weight-bold text-primary mb-0">{total.toLocaleString()} đ</span>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            className="btn btn-primary btn-block py-3 rounded-pill font-weight-bold shadow-sm w-100"
                                            style={{ fontSize: "1.1rem" }}
                                        >
                                            Thanh toán qua VNPay
                                        </button>

                                        <div className="mt-4 text-center">
                                            <p className="small text-muted mb-2">Chúng tôi chấp nhận:</p>
                                            <div className="d-flex justify-content-center gap-2 opacity-75">
                                                <span className="badge badge-light border px-2 py-1">VNPay</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
