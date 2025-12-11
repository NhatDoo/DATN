type HeroProps = {
  background: string;   // đường dẫn ảnh nền
  // tiêu đề phụ
};

export default function Hero({ background }: HeroProps) {
  return (
    <section
      className="hero-wrap"
      style={{ paddingTop: '114px', backgroundImage: `url(${background})`, height: '300px', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >

    </section>
  );
}
