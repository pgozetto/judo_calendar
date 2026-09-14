const FPJUDO_MEDIA_API = "https://fpj.com.br/wp-json/wp/v2/media";

type WordpressMedia = {
  id: number;
  date: string;
  slug: string;
  source_url: string;
  title: { rendered: string };
};

export type FpjudoCalendarSource = {
  externalId: string;
  title: string;
  version: string | null;
  url: string;
  publishedAt: string;
};

function decodeTitle(value: string) {
  return value
    .replace(/&#8211;|&#8212;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function searchableTitle(value: string) {
  return decodeTitle(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export async function fetchFpjudoCalendarSources(): Promise<FpjudoCalendarSource[]> {
  const year = new Date().getFullYear();
  const query = new URLSearchParams({
    search: `Calendario FPJUDO ${year}`,
    per_page: "20",
    _fields: "id,date,slug,source_url,title",
  });
  const response = await fetch(`${FPJUDO_MEDIA_API}?${query}`, {
    headers: { Accept: "application/json", "User-Agent": "JudoCalendar/1.0" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`FPJUDO respondeu com status ${response.status}.`);

  const media = await response.json() as WordpressMedia[];
  return media
    .filter((item) => item.source_url.toLowerCase().endsWith(".pdf") && /calendario.*fpjudo/i.test(searchableTitle(item.title.rendered)))
    .map((item) => ({
      externalId: String(item.id),
      title: decodeTitle(item.title.rendered),
      version: item.slug.match(/v\d+(?:-\d+)?/i)?.[0]?.replace("-", ".").toUpperCase() ?? null,
      url: item.source_url,
      publishedAt: item.date,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
