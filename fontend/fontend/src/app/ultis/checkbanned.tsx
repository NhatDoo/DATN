import Cookies from "js-cookie";

export async function checkIsBanned() {
  try {

    const res = await fetch("http://localhost:3000/users/profile", {
      credentials: "include",
    });

    const data = await res.json();

    if (data.is_banned) {
      alert("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ CSKH.");
      Cookies.remove("access_token");
      return true;
    }

    return false;
  } catch (err) {
    console.error("Lỗi kiểm tra trạng thái ban:", err);
    return false;
  }
}
