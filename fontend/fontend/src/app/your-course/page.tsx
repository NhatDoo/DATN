"use client";

import Navbar from "../components/Navbar";
import Metahead from "../components/Head";
import Hero from "../components/Herowrap";
import Footer from "../components/Footer";
import "../globals.css";
import Loader from "../components/Loader";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  slug: string;
  price_bigint: number;
  category_id: string;
  meta: any;
  instructor_id: string;
}

export default function CoursePage() {

  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [instructorMap, setInstructorMap] = useState<Record<string, any>>({});
  const [instructorsLoaded, setInstructorsLoaded] = useState(false);
  const coursesPerPage = 10;
  const router = useRouter();

  const fetchInstructors = async (courses: any[]) => {
    const uniqueIds = [...new Set(courses.map((c) => c.instructor_id).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const promises = uniqueIds.map((id) =>
      fetch(`http://localhost:3000/users/${id}`)
        .then((res) => {
          if (!res.ok) return { full_name: "System" };
          return res.json();
        })
        .catch(() => ({ full_name: "System" }))
    );

    const results = await Promise.all(promises);
    const map: Record<string, any> = {};
    uniqueIds.forEach((id, i) => (map[id] = results[i]));
    setInstructorMap(map);
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3006/search`, {
        params: { q: searchTerm, top_k: 5 },
      });
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("❌ Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:3003/enrollments/my-courses", {
          credentials: "include",
          cache: "no-cache",
        });
        if (!res.ok) throw new Error("failed");

        const data = await res.json(); // đây là enrollments
        setCourses(data);

        if (!instructorsLoaded && data.length > 0) {
          await fetchInstructors(data.map((e: any) => e.course));
          setInstructorsLoaded(true);
        }
      } catch (err) {
        console.error("❌ load failed:", err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [instructorsLoaded]);

  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedCourses = searchResults.length > 0 ? searchResults : currentCourses;

  return (
    <main>
      <Metahead />
      <Navbar />
      <Hero background="/images/bg_2.jpg" />

      <section className="ftco-section bg-light">
        <div className="container">
          <div className="row">

            {/* Sidebar */}
            <div className="col-lg-3 sidebar">
              <div className="sidebar-box bg-white ftco-animate">
                <form onSubmit={handleSearch} className="search-form flex items-center gap-2">
                  <div className="relative w-full">
                    <span className="absolute left-3 top-2.5 text-gray-400">
                      <i className="fa fa-search"></i>
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Tìm kiếm khóa học..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    {loading ? "Đang tìm..." : "Tìm"}
                  </button>
                </form>
              </div>
            </div>

            {/* Course list */}
            <div className="col-lg-9">
              <div className="row">
                {displayedCourses.map((item: any, i) => {

                  const course = item.meta ? item.meta : item.course ? item.course : item;
                  const instructor = instructorMap[course.instructor_id];
                  const instructorName = instructor?.full_name || "System";

                  const handleClick = () => {
                    window.location.href = `/course/${course.slug}`;
                  };

                  return (
                    <div key={i} onClick={handleClick} className="col-md-6 mb-4">
                      <div className="project-wrap">
                        <a
                          className="img"
                          style={{
                            backgroundImage: `url(${course.background || "/image.png"})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <span className="price">{course.category_id}</span>
                        </a>

                        <div className="text p-4">
                          <h3>{course.title}</h3>
                          <p className="advisor">
                            Giảng viên: <span>{instructorName}</span>
                          </p>
                          <ul className="d-flex justify-content-between">
                            <li>{course.enrollment_count || 0} học viên</li>
                            <li className="price">VND {course.price_bigint}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="row mt-5">
                <div className="col">
                  <div className="block-27">
                    <ul className="pagination d-flex justify-content-center">
                      <li onClick={() => handlePageChange(currentPage - 1)}><a href="#">&lt;</a></li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => handlePageChange(i + 1)}>
                          <a href="#">{i + 1}</a>
                        </li>
                      ))}
                      <li onClick={() => handlePageChange(currentPage + 1)}><a href="#">&gt;</a></li>
                    </ul>
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
