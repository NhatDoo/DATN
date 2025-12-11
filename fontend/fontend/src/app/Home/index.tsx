import Navbar from "../components/Navbar";
import Metahead from "../components/Head";
import RegisterForm from "../components/RegisterForm";
import Hero from "../components/Herowrap";
import Startlearning from "../components/Statlearning";
import Course from "../components/Course";
import Footer from "../components/Footer";
import Loader from "../components/Loader";

export default function Index() {
  return (
     <main>
      <Metahead />
      <Navbar/>
      <Hero 
       background="/images/bg_1.jpg"/>
      <RegisterForm/>
      <Startlearning/>
      <Course/>
      <section className="ftco-section ftco-counter img" id="section-counter" style={{ backgroundImage: "url('/images/bg_3.jpg')" }}>
        <div className="overlay"></div>
        <div className="container">
            <div className="row">
              <div className="col-md-3 d-flex justify-content-center counter-wrap ftco-animate">
                <div className="block-18 d-flex align-items-center">
                    <div className="icon"><span className="flaticon-online"></span></div>
                    <div className="text">
                    <strong className="number" data-number="400">0</strong>
                    <span>Online Courses</span>
                </div>
            </div>
        </div>
        <div className="col-md-3 d-flex justify-content-center counter-wrap ftco-animate">
            <div className="block-18 d-flex align-items-center">
                <div className="icon"><span className="flaticon-graduated"></span></div>
                <div className="text">
                <strong className="number" data-number="4500">0</strong>
                <span>Students Enrolled</span>
            </div>
        </div>
        </div>
        <div className="col-md-3 d-flex justify-content-center counter-wrap ftco-animate">
        <div className="block-18 d-flex align-items-center">
            <div className="icon"><span className="flaticon-instructor"></span></div>
            <div className="text">
            <strong className="number" data-number="1200">0</strong>
            <span>Experts Instructors</span>
        </div>
        </div>
        </div>
        <div className="col-md-3 d-flex justify-content-center counter-wrap ftco-animate">
        <div className="block-18 d-flex align-items-center">
            <div className="icon"><span className="flaticon-tools"></span></div>
            <div className="text">
            <strong className="number" data-number="300">0</strong>
            <span>Hours Content</span>
        </div>
        </div>
        </div>
        </div>
        </div>
        </section>

        <section className="ftco-section ftco-about img">
          <div className="container">
              <div className="row d-flex">
                <div className="col-md-12 about-intro">
                    <div className="row">
                      <div className="col-md-6 d-flex">
                          <div className="d-flex about-wrap">
                            <div className="img d-flex align-items-center justify-content-center" style={{ backgroundImage: "url('/images/about-1.jpg')" }}>
                            </div>
                            <div className="img-2 d-flex align-items-center justify-content-center" style={{ backgroundImage: "url('/images/about.jpg')" }}>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 pl-md-5 py-5">
                      <div className="row justify-content-start pb-3">
                          <div className="col-md-12 heading-section ftco-animate">
                            <span className="subheading">Enhanced Your Skills</span>
                            <h2 className="mb-4">Learn Anything You Want Today</h2>
                            <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean. A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
                            <p><a href="#" className="btn btn-primary">Get in touch with us</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
        </div>
        </section>


        <section className="ftco-section testimony-section bg-light">
          <div className="overlay" style={{ backgroundImage: "url('images/bg_2.jpg')"}}></div>
          <div className="container">
            <div className="row pb-4">
              <div className="col-md-7 heading-section ftco-animate">
                <span className="subheading">Testimonial</span>
                <h2 className="mb-4">What Are Students Says</h2>
            </div>
        </div>
        </div>
        <div className="container container-2">
            <div className="row ftco-animate">
              <div className="col-md-12">
                <div className="carousel-testimony owl-carousel">
                  <div className="item">
                    <div className="testimony-wrap py-4">
                      <div className="text">
                        <p className="star">
                            <span className="fa fa-star"></span>
                            <span className="fa fa-star"></span>
                            <span className="fa fa-star"></span>
                            <span className="fa fa-star"></span>
                            <span className="fa fa-star"></span>
                        </p>
                        <p className="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>
                        <div className="d-flex align-items-center">
                          <div className="user-img"  style={{ backgroundImage: "url('images/person_1.jpg')"}}></div>
                          <div className="pl-3">
                              <p className="name">Roger Scott</p>
                              <span className="position">Marketing Manager</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <div className="item">
            <div className="testimony-wrap py-4">
              <div className="text">
                <p className="star">
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                </p>
                <p className="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>
                <div className="d-flex align-items-center">
                  <div className="user-img" style={{ backgroundImage: "url('images/person_2.jpg')"}}></div>
                  <div className="pl-3">
                      <p className="name">Roger Scott</p>
                      <span className="position">Marketing Manager</span>
                  </div>
              </div>
          </div>
        </div>
        </div>
        <div className="item">
            <div className="testimony-wrap py-4">
              <div className="text">
                <p className="star">
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                </p>
                <p className="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>
                <div className="d-flex align-items-center">
                  <div className="user-img" style={{ backgroundImage: "url('images/person_3.jpg')"}}></div>
                  <div className="pl-3">
                      <p className="name">Roger Scott</p>
                      <span className="position">Marketing Manager</span>
                  </div>
              </div>
          </div>
        </div>
        </div>
        <div className="item">
            <div className="testimony-wrap py-4">
              <div className="text">
                <p className="star">
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                </p>
                <p className="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>
                <div className="d-flex align-items-center">
                  <div className="user-img"style={{ backgroundImage: "url('images/person_4.jpg')"}}></div>
                  <div className="pl-3">
                      <p className="name">Roger Scott</p>
                      <span className="position">Marketing Manager</span>
                  </div>
              </div>
          </div>
        </div>
        </div>
        <div className="item">
            <div className="testimony-wrap py-4">
              <div className="text">
                <p className="star">
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                    <span className="fa fa-star"></span>
                </p>
                <p className="mb-4">Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.</p>
                <div className="d-flex align-items-center">
                  <div className="user-img" style={{ backgroundImage: "url('images/person_2.jpg')"}}></div>
                  <div className="pl-3">
                      <p className="name">Roger Scott</p>
                      <span className="position">Marketing Manager</span>
                  </div>
              </div>
          </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
        </section>

        <section className="ftco-intro ftco-section ftco-no-pb">
        <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-12 text-center">
                  <div className="img"  style={{ backgroundImage: "url('images/bg_4.jpg')"}}>
                    <div className="overlay"></div>
                    <h2>We Are StudyLab An Online Learning Center</h2>
                    <p>We can manage your dream building A small river named Duden flows by their place</p>
                    <p className="mb-0"><a href="#" className="btn btn-primary px-4 py-3">Enroll Now</a></p>
                </div>
            </div>
        </div>
        </div>
        </section>

        <section className="ftco-section services-section">
          <div className="container">
            <div className="row d-flex">
              <div className="col-md-6 heading-section pr-md-5 ftco-animate d-flex align-items-center">
                <div className="w-100 mb-4 mb-md-0">
                    <span className="subheading">Welcome to StudyLab</span>
                    <h2 className="mb-4">We Are StudyLab An Online Learning Center</h2>
                    <p>A small river named Duden flows by their place and supplies it with the necessary regelialia. It is a paradisematic country, in which roasted parts of sentences fly into your mouth.</p>
                    <p>Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts. Separated they live in Bookmarksgrove right at the coast of the Semantics, a large language ocean.</p>
                    <div className="d-flex video-image align-items-center mt-md-4">
                      <a href="#" className="video img d-flex align-items-center justify-content-center" style={{ backgroundImage: "url('images/about.jpg')" }}>
                        <span className="fa fa-play-circle"></span>
                    </a>
                    <h4 className="ml-4">Learn anything from StudyLab, Watch video</h4>
                </div>
            </div>
        </div>
        <div className="col-md-6">
            <div className="row">
                <div className="col-md-12 col-lg-6 d-flex align-self-stretch ftco-animate">
                  <div className="services">
                    <div className="icon d-flex align-items-center justify-content-center"><span className="flaticon-tools"></span></div>
                    <div className="media-body">
                      <h3 className="heading mb-3">Top Quality Content</h3>
                      <p>A small river named Duden flows by their place and supplies</p>
                  </div>
              </div>      
          </div>
          <div className="col-md-12 col-lg-6 d-flex align-self-stretch ftco-animate">
              <div className="services">
                <div className="icon icon-2 d-flex align-items-center justify-content-center"><span className="flaticon-instructor"></span></div>
                <div className="media-body">
                  <h3 className="heading mb-3">Highly Skilled Instructor</h3>
                  <p>A small river named Duden flows by their place and supplies</p>
              </div>
          </div>    
        </div>
        <div className="col-md-12 col-lg-6 d-flex align-self-stretch ftco-animate">
          <div className="services">
            <div className="icon icon-3 d-flex align-items-center justify-content-center"><span className="flaticon-quiz"></span></div>
            <div className="media-body">
              <h3 className="heading mb-3">World className &amp; Quiz</h3>
              <p>A small river named Duden flows by their place and supplies</p>
          </div>
        </div>      
        </div>
        <div className="col-md-12 col-lg-6 d-flex align-self-stretch ftco-animate">
          <div className="services">
            <div className="icon icon-4 d-flex align-items-center justify-content-center"><span className="flaticon-browser"></span></div>
            <div className="media-body">
              <h3 className="heading mb-3">Get Certified</h3>
              <p>A small river named Duden flows by their place and supplies</p>
          </div>
        </div>      
        </div>
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