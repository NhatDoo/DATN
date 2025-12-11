"use client";

import Navbar from "../components/Navbar";
import Metahead from "../components/Head";
import Footer from "../components/Footer";
import "../globals.css";
import Loader from "../components/Loader";
import styles from "./About.module.css";

export default function AboutPage() {
    return (
        <main>
            <Metahead />
            <Navbar />

            {/* Hero Section */}
            <section className={styles.aboutHero}>
                <div className="container">
                    <h1>Về chúng tôi</h1>
                    <p>
                        Nền tảng học trực tuyến hàng đầu Việt Nam, mang đến cho bạn
                        những khóa học chất lượng cao và trải nghiệm học tập tuyệt vời
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="ftco-section bg-light">
                <div className="container">
                    <div className="row justify-content-center mb-5">
                        <div className="col-md-8 text-center">
                            <h2 className={styles.sectionTitle}>Sứ mệnh của chúng tôi</h2>
                            <p className={styles.sectionSubtitle}>
                                Chúng tôi cam kết mang đến giáo dục chất lượng cao,
                                dễ tiếp cận cho mọi người
                            </p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className={styles.missionCard}>
                                <h3>🎯 Tầm nhìn</h3>
                                <p>
                                    Trở thành nền tảng học trực tuyến hàng đầu tại Việt Nam,
                                    nơi mọi người có thể tiếp cận kiến thức chất lượng cao và
                                    phát triển kỹ năng để thành công trong sự nghiệp.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className={styles.missionCard}>
                                <h3>💡 Sứ mệnh</h3>
                                <p>
                                    Làm cho việc học trở nên dễ dàng, thú vị và hiệu quả thông qua
                                    công nghệ hiện đại, nội dung chất lượng và đội ngũ giảng viên
                                    giàu kinh nghiệm.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.statsSection}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-3 col-6 mb-4">
                            <div className={styles.statCard}>
                                <span className={styles.statNumber}>400+</span>
                                <span className={styles.statLabel}>Khóa học</span>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-4">
                            <div className={styles.statCard}>
                                <span className={styles.statNumber}>10K+</span>
                                <span className={styles.statLabel}>Học viên</span>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-4">
                            <div className={styles.statCard}>
                                <span className={styles.statNumber}>150+</span>
                                <span className={styles.statLabel}>Giảng viên</span>
                            </div>
                        </div>
                        <div className="col-md-3 col-6 mb-4">
                            <div className={styles.statCard}>
                                <span className={styles.statNumber}>50+</span>
                                <span className={styles.statLabel}>Chứng chỉ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="ftco-section">
                <div className="container">
                    <div className="row justify-content-center mb-5">
                        <div className="col-md-8 text-center">
                            <h2 className={styles.sectionTitle}>Giá trị cốt lõi</h2>
                            <p className={styles.sectionSubtitle}>
                                Những giá trị mà chúng tôi luôn hướng tới trong mọi hoạt động
                            </p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
                                    <QualityIcon />
                                </div>
                                <h3>Chất lượng</h3>
                                <span className={styles.subtitle}>Cam kết chất lượng cao</span>
                                <p>
                                    Mọi khóa học đều được thiết kế và kiểm duyệt kỹ lưỡng
                                    để đảm bảo chất lượng tốt nhất.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
                                    <InnovationIcon />
                                </div>
                                <h3>Đổi mới</h3>
                                <span className={styles.subtitle}>Luôn cập nhật xu hướng</span>
                                <p>
                                    Không ngừng đổi mới và cập nhật nội dung theo xu hướng
                                    công nghệ mới nhất.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
                                    <SupportIcon />
                                </div>
                                <h3>Hỗ trợ</h3>
                                <span className={styles.subtitle}>Hỗ trợ tận tâm 24/7</span>
                                <p>
                                    Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn trong suốt
                                    quá trình học tập.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
                                    <CommunityIcon />
                                </div>
                                <h3>Cộng đồng</h3>
                                <span className={styles.subtitle}>Xây dựng cộng đồng học tập</span>
                                <p>
                                    Tạo môi trường học tập tích cực, nơi mọi người kết nối
                                    và cùng phát triển.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Info Section */}
            <section className="ftco-section bg-light">
                <div className="container">
                    <div className="row justify-content-center mb-5">
                        <div className="col-md-8 text-center">
                            <h2 className={styles.sectionTitle}>Thông tin liên hệ</h2>
                            <p className={styles.sectionSubtitle}>
                                Hãy liên hệ với chúng tôi để được tư vấn và hỗ trợ
                            </p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.contactCard}>
                                <span className={styles.label}>📍 Địa chỉ</span>
                                <span className={styles.value}>
                                    Tân Thới Hiệp, Quận 12, TP.HCM
                                </span>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.contactCard}>
                                <span className={styles.label}>📞 Điện thoại</span>
                                <a href="tel:0777057475" className={styles.value}>
                                    0777 057 475
                                </a>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.contactCard}>
                                <span className={styles.label}>📧 Email</span>
                                <a href="mailto:contact@learncamp.vn" className={styles.value}>
                                    contact@learncamp.vn
                                </a>
                            </div>
                        </div>
                        <div className="col-md-3 col-sm-6 mb-4">
                            <div className={styles.contactCard}>
                                <span className={styles.label}>👤 Liên hệ</span>
                                <span className={styles.value}>
                                    Nguyễn Minh Nhật
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            <Loader />
        </main>
    );
}

// Icon Components
function QualityIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

function InnovationIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

function SupportIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function CommunityIcon() {
    return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
