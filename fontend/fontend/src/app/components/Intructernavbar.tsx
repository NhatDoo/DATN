"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import styles from "./Intructernavbar.module.css";

export default function Intructernavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const [instructorName, setInstructorName] = useState<string>("");

  useEffect(() => {
    const fetchInstructorName = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.full_name) {
            setInstructorName(data.full_name);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchInstructorName();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("http://localhost:3000/users/logout", {
        method: "POST",
        credentials: "include",
      });

      Cookies.remove("access_token");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Đăng xuất thất bại, vui lòng thử lại!");
    }
  };

  const navItems = [
    { name: "Về chúng tôi", href: "/about", icon: <InfoIcon /> },
    { name: "Khóa học", href: "/intructor", icon: <BookIcon /> },
    { name: "Thêm khóa học", href: "/intructor/intructor_course", icon: <PlusCircleIcon /> },
    { name: "Blog", href: "/blog", icon: <FileTextIcon /> },
    { name: "Cảnh báo", href: "/intructor/alerts", icon: <AlertIcon /> },
  ];

  return (
    <>
      <nav className={styles.navbar} id="ftco-navbar">
        <div className={styles.container}>
          <a href="/" className={styles.brand}>
            <span className={styles.brandHighlight}>Learn</span>Camp
          </a>

          {/* Desktop Menu */}
          <ul className={styles.navLinks}>
            {navItems.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <a
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""
                    }`}
                >
                  {item.icon}
                  {item.name}
                </a>
              </li>
            ))}
            <li className={styles.navItem}>
              <span className={styles.navLink} style={{ cursor: "default", color: "#fff", fontWeight: "bold", fontSize: "0.85rem" }}>
                Hi, {instructorName}
              </span>
            </li>
            <li className={styles.navItem}>
              <a href="/login" className={styles.logoutBtn} onClick={handleLogout}>
                <LogoutIcon />
                Đăng xuất
              </a>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ""
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Sidebar */}
      <div
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ""
          }`}
      >
        <button
          className={styles.closeBtn}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <CloseIcon />
        </button>

        <ul className={styles.mobileNavLinks}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </a>
            </li>
          ))}
          <li>
            <span className={styles.mobileNavLink} style={{ color: "#fff", fontWeight: "bold", justifyContent: "center", fontSize: "0.9rem" }}>
              Hi, {instructorName}
            </span>
          </li>
          <li>
            <a
              href="/login"
              className={`${styles.mobileNavLink} ${styles.logoutBtn}`}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleLogout(e);
              }}
              style={{ marginTop: "1rem", justifyContent: "center" }}
            >
              <LogoutIcon />
              Đăng xuất
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}

// Icons
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}