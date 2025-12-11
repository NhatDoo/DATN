type HeroProps = {
  background: string;   // đường dẫn ảnh nền
  // tiêu đề phụ
};

export default function Hero({ background }: HeroProps) {
  return (
    <section
      className="hero-wrap js-fullheight"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="overlay"></div>
      <div className="container">
        <div className="row no-gutters slider-text js-fullheight align-items-center">
          <div className="col-md-7 ftco-animate">
            <span className="subheading">Chào mừng đến với LearnCamp</span>
            <h1 className="mb-4">
              Nền tảng học trực tuyến hàng đầu Việt Nam
            </h1>
            <p className="caps">
              Khám phá hàng ngàn khóa học chất lượng cao với đội ngũ giảng viên
              giàu kinh nghiệm, giúp bạn phát triển kỹ năng và đạt được mục tiêu nghề nghiệp
            </p>
            <p className="mb-0">
              <a href="/course" className="btn btn-primary">
                Khóa học của chúng tôi
              </a>{" "}
              <a href="/about" className="btn btn-white">
                Tìm hiểu thêm
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
