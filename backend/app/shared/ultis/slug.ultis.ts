import slugify from "slugify";

/**
 * Sinh slug duy nhất cho model (dựa vào title hoặc name)
 */
export async function generateUniqueSlug(model: any, data: any): Promise<string> {
  try {
    if (typeof data.slug === "string" && data.slug.trim() !== "") {
      return data.slug.trim().toLowerCase();
    }

    const base = data.title || data.name || `item-${Date.now()}`;
    const baseSlug = slugify(base, { lower: true, strict: true, locale: "vi" });

    let slug = baseSlug;
    let count = 1;

    // Nếu model không có findFirst thì trả slug gốc luôn
    if (!model || typeof model.findFirst !== "function") return slug;

    // Vòng lặp tránh trùng; nếu model.findFirst ném lỗi (vd: field không tồn tại) -> catch và return slug
    while (true) {
      try {
        const exists = await model.findFirst({ where: { slug } });
        if (!exists) break;
        slug = `${baseSlug}-${count++}`;
      } catch (err) {
        // Nếu lỗi vì field slug không tồn tại hoặc lỗi khác, bỏ qua kiểm tra và trả slug hiện tại
        console.warn("generateUniqueSlug: model.findFirst threw, returning current slug", err);
        return slug;
      }
    }

    return slug;
  } catch (err) {
    console.error("❌ generateUniqueSlug error:", err);
    return `slug-${Date.now()}`;
  }
}
