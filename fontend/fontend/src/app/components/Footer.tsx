export default function Footer() {
    return (
        <footer className="ftco-footer ftco-no-pt">
            <div className="container">
                <div className="row mb-5">
                    <div className="col-md pt-5">
                        <div className="ftco-footer-widget pt-md-5 mb-4">
                            <h2 className="ftco-heading-2">Về chúng tôi</h2>
                            <p>LearnCamp - Nền tảng học trực tuyến hàng đầu, mang đến cho bạn những khóa học chất lượng cao với đội ngũ giảng viên giàu kinh nghiệm.</p>
                            <ul className="ftco-footer-social list-unstyled float-md-left float-lft">
                                <li className="ftco-animate"><a href="#"><span className="fa fa-twitter"></span></a></li>
                                <li className="ftco-animate"><a href="#"><span className="fa fa-facebook"></span></a></li>
                                <li className="ftco-animate"><a href="#"><span className="fa fa-instagram"></span></a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-md pt-5">
                        <div className="ftco-footer-widget pt-md-5 mb-4 ml-md-5">
                            <h2 className="ftco-heading-2">Hỗ trợ</h2>
                            <ul className="list-unstyled">
                                <li><a href="#" className="py-2 d-block">Chăm sóc khách hàng</a></li>
                                <li><a href="#" className="py-2 d-block">Hỗ trợ pháp lý</a></li>
                                <li><a href="#" className="py-2 d-block">Dịch vụ</a></li>
                                <li><a href="#" className="py-2 d-block">Chính sách bảo mật</a></li>
                                <li><a href="#" className="py-2 d-block">Chính sách hoàn tiền</a></li>
                                <li><a href="#" className="py-2 d-block">Liên hệ</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-md pt-5">
                        <div className="ftco-footer-widget pt-md-5 mb-4">
                            <h2 className="ftco-heading-2">Khóa học nổi bật</h2>
                            <ul className="list-unstyled">
                                <li><a href="#" className="py-2 d-block">Lập trình Web</a></li>
                                <li><a href="#" className="py-2 d-block">Thiết kế đồ họa</a></li>
                                <li><a href="#" className="py-2 d-block">Quản trị kinh doanh</a></li>
                                <li><a href="#" className="py-2 d-block">Marketing số</a></li>
                                <li><a href="#" className="py-2 d-block">Phát triển ứng dụng</a></li>
                                <li><a href="#" className="py-2 d-block">Khoa học dữ liệu</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="col-md pt-5">
                        <div className="ftco-footer-widget pt-md-5 mb-4">
                            <h2 className="ftco-heading-2">Liên hệ với chúng tôi</h2>
                            <div className="block-23 mb-3">
                                <ul>
                                    <li><span className="icon fa fa-map-marker"></span><span className="text">Tân Thới Hiệp, Quận 12, TP.HCM</span></li>
                                    <li><a href="tel:0777057475"><span className="icon fa fa-phone"></span><span className="text">0777 057 475</span></a></li>
                                    <li><a href="mailto:contact@learncamp.vn"><span className="icon fa fa-paper-plane"></span><span className="text">Nguyễn Minh Nhật</span></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12 text-center">

                        <p>
                            Bản quyền &copy; {new Date().getFullYear()} Tất cả quyền được bảo lưu | Được phát triển với <i className="fa fa-heart" aria-hidden="true"></i> bởi{" "}
                            <a href="https://learncamp.vn" target="_blank" rel="noopener noreferrer">
                                LearnCamp
                            </a>
                        </p>




                    </div>
                </div>
            </div>
        </footer>
    );
}
