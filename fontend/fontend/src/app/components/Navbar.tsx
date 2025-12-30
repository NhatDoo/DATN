"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import Cookies from "js-cookie";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.full_name) {
            setUserName(data.full_name);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchUserName();
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
    { name: "Khóa học", href: "/course", icon: <BookIcon /> },
    { name: "Khóa học của bạn", href: "/your-course", icon: <LibraryIcon /> },
    { name: "Xem chứng chỉ", href: "/certificates", icon: <CertificateIcon /> },
    { name: "Đơn hàng", href: "/cart", icon: <CartIcon /> },
    { name: "Liên hệ", href: "/contact", icon: <PhoneIcon /> },
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
                Hi, {userName}
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
              Hi, {userName}
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

function LibraryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
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

function CertificateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-2 5l9-5l9 5l-2-5" />
      <circle cx="12" cy="9" r="6" />
      <path d="M9 22l3-8l3 8z" opacity="0" />
      {/* Simplified icon for certificate */}
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );
}
