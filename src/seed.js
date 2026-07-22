import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool, query } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Projects copied from the Next.js frontend lib/data.ts
const projects = [
  {
    title: "Nordheim Residence",
    type: "RESIDENTIAL",
    location: "OSLO, NORWAY",
    year: "2024",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=900&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=900&fit=crop",
    ],
    description:
      "A private residence set into a forested hillside outside Oslo, framing views of the valley through cantilevered volumes.",
    longDescription:
      "A private residence set into a forested hillside outside Oslo. The structure responds to the dramatic topography through a series of cantilevered volumes that frame views of the valley below. Raw concrete, oak, and expansive glazing define an interior of quiet complexity. Each room is oriented to capture a specific quality of northern light, while a central hearth anchors the open living spaces around a single sculptural mass.",
    detail: { client: "Private", area: "420 m²", status: "Completed", services: ["Architecture", "Interior", "Landscape"] },
  },
  {
    title: "The Lund Pavilion",
    type: "CULTURAL",
    location: "LUND, SWEDEN",
    year: "2023",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=900&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=900&fit=crop",
    ],
    description:
      "A public pavilion built from locally-sourced cross-laminated timber, blurring the line between landscape and architecture.",
    longDescription:
      "A public pavilion and event space for the city of Lund, constructed from locally-sourced cross-laminated timber. The pavilion functions as a covered outdoor room, blurring the boundary between landscape and architecture through its translucent polycarbonate roof. The structure can be fully opened to the surrounding park in summer and sealed against the elements in winter, allowing year-round civic use.",
    detail: { client: "City of Lund", area: "680 m²", status: "Completed", services: ["Architecture", "Structure", "Lighting"] },
  },
  {
    title: "Aalto Commercial Tower",
    type: "COMMERCIAL",
    location: "HELSINKI, FINLAND",
    year: "2023",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=900&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=1200&h=900&fit=crop",
    ],
    description:
      "A mixed-use tower in central Helsinki whose stepped profile creates a series of public terraces above the harbour.",
    longDescription:
      "A mixed-use commercial tower in central Helsinki that challenges the city's traditional block structure. The tower's stepped profile creates a series of public terraces at multiple levels, offering views across the harbour and integrating the building into the urban fabric. A double-skin glass facade moderates the extreme Nordic climate while flooding the workspaces with daylight throughout the long winter months.",
    detail: { client: "Aalto Group", area: "14,200 m²", status: "Completed", services: ["Architecture", "Urban Design", "Facade"] },
  },
  {
    title: "Bergman Cultural Centre",
    type: "CULTURAL",
    location: "COPENHAGEN, DENMARK",
    year: "2022",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=900&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1524230572899-a752b3835840?w=1200&h=900&fit=crop",
    ],
    description:
      "A cinema, gallery, and rehearsal complex woven into a former industrial warehouse in Copenhagen.",
    longDescription:
      "Named in honour of the legendary filmmaker, the Bergman Cultural Centre houses cinema, gallery, and rehearsal spaces within a former industrial warehouse. The intervention preserves the raw character of the existing structure while weaving in new elements of light, warmth, and transparency. Original brickwork and steel trusses are left exposed, set against insertions of warm timber and brass that guide visitors through the building.",
    detail: { client: "Bergman Foundation", area: "3,900 m²", status: "Completed", services: ["Architecture", "Adaptive Reuse", "Acoustics"] },
  },
];

const news = [
  {
    slug: "nordheim-residence-completed",
    titleEn: "Nordheim Residence reaches completion",
    titleMn: "Nordheim Residence төсөл ашиглалтад орлоо",
    excerptEn: "Our forested hillside residence outside Oslo is now complete.",
    excerptMn: "Осло хотын ойролцоох ойт толгод дээрх амины орон сууц маань бэлэн боллоо.",
    bodyEn: "After two years of construction, the Nordheim Residence is complete. The cantilevered volumes and raw concrete interiors are now home to a private client overlooking the valley.",
    bodyMn: "Хоёр жилийн бүтээн байгуулалтын дараа Nordheim Residence бүрэн ашиглалтад орлоо. Консолон эзлэхүүн ба түүхий бетон интерьер нь хөндийг харсан амины захиалагчийн гэр болов.",
    categoryEn: "Projects",
    categoryMn: "Төсөл",
    coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
    published: true,
  },
  {
    slug: "studio-awarded-nordic-prize",
    titleEn: "Studio awarded Nordic Architecture Prize",
    titleMn: "Манай студи Скандинавын архитектурын шагнал хүртлээ",
    excerptEn: "Recognised for our contribution to sustainable civic architecture.",
    excerptMn: "Тогтвортой иргэний архитектурт оруулсан хувь нэмрийг маань үнэллээ.",
    bodyEn: "We are honoured to receive this year's Nordic Architecture Prize for the Lund Pavilion, recognising our timber-led approach to public space.",
    bodyMn: "Олон нийтийн орон зайд модон бүтээцийг түлхүү ашигласан Lund Pavilion төслөөрөө энэ оны Скандинавын архитектурын шагналыг хүртсэндээ бид баяртай байна.",
    categoryEn: "Awards",
    categoryMn: "Шагнал",
    coverImage: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200&h=800&fit=crop",
    published: true,
  },
];

async function run() {
  console.log("→ Applying schema…");
  const schema = await readFile(join(__dirname, "schema.sql"), "utf8");
  await query(schema);

  console.log("→ Clearing existing rows…");
  await query("TRUNCATE projects RESTART IDENTITY CASCADE");
  await query("TRUNCATE news RESTART IDENTITY CASCADE");

  console.log("→ Inserting projects…");
  let order = 0;
  for (const p of projects) {
    await query(
      `INSERT INTO projects
         (title, type, location, year, image, gallery, description, long_description, detail, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10)`,
      [
        p.title, p.type, p.location, p.year, p.image,
        JSON.stringify(p.gallery), p.description, p.longDescription,
        JSON.stringify(p.detail), order++,
      ]
    );
  }

  console.log("→ Inserting news…");
  for (const n of news) {
    await query(
      `INSERT INTO news
         (slug, title_en, title_mn, excerpt_en, excerpt_mn, body_en, body_mn,
          category_en, category_mn, cover_image, published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
          CASE WHEN $11 THEN now() ELSE NULL END)`,
      [
        n.slug, n.titleEn, n.titleMn, n.excerptEn, n.excerptMn,
        n.bodyEn, n.bodyMn, n.categoryEn, n.categoryMn, n.coverImage, n.published,
      ]
    );
  }

  console.log(`✓ Seeded ${projects.length} projects and ${news.length} news items.`);
  await pool.end();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
