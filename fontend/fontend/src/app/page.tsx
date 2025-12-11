"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./globals.css"
import Loader from "@/app/components/Loader";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Gọi backend để làm mới access token
        await axios.post(
          `http://localhost:3000/users/refresh-token`,
          {},
          { withCredentials: true } // gửi cookie refresh_token
        );

        console.log("✅ Access token refreshed automatically");
        // → Nếu refresh thành công → vào trang course
        window.location.href = "/course";
      } catch (err) {
        console.log("❌ Need to login again");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );

  return null;
}
