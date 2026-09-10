// Map DB rows -> clean API shapes (camelCase, matches the Next.js frontend types)

export function serializeProject(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    location: row.location,
    year: row.year,
    image: row.image,
    description: { en: row.description_en || "", mn: row.description_mn || "" },
    detail: row.detail || {},
    sortOrder: row.sort_order,
    status: row.status,              // ← энэ мөр байх ёстой
    publishedAt: row.published_at,   // ← энэ мөр байх ёстой
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Default news shape returns BOTH languages as nested objects.
export function serializeNews(row, lang) {
  const base = {
    id: row.id,
    slug: row.slug,
    status: row.status, // 'draft' | 'published' | 'hidden'
    published: row.status === "published",
    createdAt: row.created_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    youtubeUrl: row.youtube_url || "",
  };

  if (lang === "en" || lang === "mn") {
    return { ...base, title: row[`title_${lang}`], desc: row[`desc_${lang}`] };
  }

  return {
    ...base,
    title: { en: row.title_en, mn: row.title_mn },
    desc: { en: row.desc_en, mn: row.desc_mn },
  };
}
