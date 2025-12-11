"use client";

import Navbar from "../components/Navbar";
import Metahead from "../components/Head";
import Hero from "../components/Herowrap";
import Footer from "../components/Footer";
import "../globals.css";
import Loader from "../components/Loader";
import Chatbot from '../components/chatbox'
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsBanned } from '@/app/ultis/checkbanned';

import styles from "./Course.module.css";
import cardStyles from "./CourseCard.module.css";

interface Course {
  id: string;
  title: string;
  slug: string;
  price_bigint: number;
  categories: { id: string; name: string }[];
  meta: any;
  instructor_id: string;
  enrollment_count?: number;
  background?: string;
}

export default function Course() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [instructorMap, setInstructorMap] = useState<Record<string, any>>({});
  const [courseCategoriesMap, setCourseCategoriesMap] = useState<Record<string, any[]>>({});
  const coursesPerPage = 10;
  const [instructorsLoaded, setInstructorsLoaded] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  const fetchCourseCategories = async (courses: any[]) => {
    const uniqueIds = [...new Set(courses.map((c) => c.id).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    const promises = uniqueIds.map((id) =>
      fetch(`http://localhost:3001/course/${id}/categories`)
        .then((res) => res.json())
        .catch(() => [])
    );

    const results = await Promise.all(promises);
    const map: Record<string, any[]> = {};
    uniqueIds.forEach((id, i) => (map[id] = results[i]));
    setCourseCategoriesMap(map);
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
      console.error("❌ Search failed:");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIsBanned();
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:3005/recommend", {
          credentials: "include",
          cache: "no-cache",
        });

        let data = [];
        if (res.ok) {
          data = await res.json();
        }

        if (!data || data.length === 0) {
          const fallbackRes = await fetch("http://localhost:3001/course", {
            cache: "no-cache",
          });

          if (fallbackRes.ok) {
            data = await fallbackRes.json();
          }
        }

        if (!instructorsLoaded && data.length > 0) {
          await fetchInstructors(data);
          await fetchCourseCategories(data);
          setInstructorsLoaded(true);
        }

        setCourses(data);
      } catch (err) {
        try {
          const fallbackRes = await fetch("http://localhost:3001/course", {
            cache: "no-cache",
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            await fetchInstructors(fallbackData);
            await fetchCourseCategories(fallbackData);
            setCourses(fallbackData);
          }
        } catch (err2) {
          console.error("❌ Fallback /course also failed:", err2);
        }
      }
    };

    fetchCourses();
  }, [instructorsLoaded]);

  useEffect(() => {
    const fetchAllCats = async () => {
      try {
        const res = await fetch("http://localhost:3001/categories");
        if (res.ok) {
          const data = await res.json();
          setAllCategories(data);
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchAllCats();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    setCurrentPage(1);
  };

  const getCourseData = (item: any) => item.meta ? item.meta : item;

  let sourceList = searchResults.length > 0 ? searchResults : courses;

  const filteredList = sourceList.filter((item: any) => {
    const course = getCourseData(item);
    if (selectedCategories.length === 0) return true;

    const courseCategories = courseCategoriesMap[course.id] || course.categories || [];

    if (Array.isArray(courseCategories) && courseCategories.length > 0) {
      return courseCategories.some((cat: any) => selectedCategories.includes(cat.id));
    }
    return false;
  });

  const totalPages = Math.ceil(filteredList.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const displayedCourses = filteredList.slice(indexOfFirstCourse, indexOfLastCourse);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              <div className="sidebar-box bg-white p-4 ftco-animate">
                <h3 className="heading-sidebar">Danh mục khóa học</h3>
                <form action="#" className="browse-form">
                  {allCategories.map((cat) => (
                    <div key={cat.id}>
                      <label htmlFor={`option-category-${cat.id}`}>
                        <input
                          type="checkbox"
                          id={`option-category-${cat.id}`}
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => handleCategoryChange(cat.id)}
                        /> {cat.name}
                      </label><br />
                    </div>
                  ))}
                </form>
              </div>
            </div>

            {/* Course list */}
            <div className="col-lg-9">
              <div className={styles.searchContainer}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                  <div className={styles.inputWrapper}>
                    <SearchIcon className={styles.searchIcon} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                      placeholder="Tìm kiếm..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.searchButton}
                  >
                    {loading ? "..." : "Tìm"}
                  </button>
                </form>
              </div>

              <div className={cardStyles.coursesGrid}>
                {displayedCourses.map((item, i) => {
                  const course = getCourseData(item);
                  const instructor = instructorMap[course.instructor_id];
                  const instructorName = instructor?.full_name || "System";

                  const handleClick = async () => {
                    try {
                      await fetch("http://localhost:3004/recommend/log", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          keyword: course.title,
                          action_type: "view",
                          title: course.title,
                          course_id: course.id,
                          price: course.price_bigint,
                        }),
                        credentials: "include",
                      });
                    } catch (err) {
                      console.error("❌ Failed to log view:", err);
                    }

                    router.push(`/course/${course.slug}`);
                    router.refresh();
                  };

                  return (
                    <div key={i} onClick={handleClick} className={cardStyles.courseCard}>
                      <div
                        className={cardStyles.courseImage}
                        style={{
                          backgroundImage: `url(${course.background || "/image.png"})`,
                        }}
                      >
                        <span className={cardStyles.categoryBadge}>
                          {(courseCategoriesMap[course.id] || course.categories || [])
                            .map((c: any) => c.name)
                            .join(", ") || "Chưa phân loại"}
                        </span>
                      </div>

                      <div className={cardStyles.courseContent}>
                        <h3 className={cardStyles.courseTitle}>{course.title}</h3>

                        <div className={cardStyles.instructorInfo}>
                          <InstructorIcon className={cardStyles.instructorIcon} />
                          <span className={cardStyles.instructorName}>{instructorName}</span>
                        </div>

                        <div className={cardStyles.courseFooter}>
                          <div className={cardStyles.enrollmentCount}>
                            <UsersIcon className={cardStyles.enrollmentIcon} />
                            <span>{course.enrollment_count || 0} học viên</span>
                          </div>
                          <div className={cardStyles.coursePrice}>
                            {course.price_bigint.toLocaleString('vi-VN')} ₫
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="row mt-5">
                <div className="col">
                  <div className="block-27">
                    <ul className="pagination d-flex justify-content-center">
                      <li onClick={() => handlePageChange(currentPage - 1)}>
                        <a href="#">&lt;</a>
                      </li>
                      {[...Array(totalPages)].map((_, i) => (
                        <li
                          key={i}
                          className={currentPage === i + 1 ? "active" : ""}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          <a href="#">{i + 1}</a>
                        </li>
                      ))}
                      <li onClick={() => handlePageChange(currentPage + 1)}>
                        <a href="#">&gt;</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Chatbot />
      <Footer />
      <Loader />
    </main>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function InstructorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
