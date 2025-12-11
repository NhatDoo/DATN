import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserId(decoded.sub);
    } catch (err) {
      console.error("Không thể giải mã token:", err);
    }
  }, []);

  return userId;
}
