// Wikimedia Commons image search and import
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_BYTES = 5 * 1024 * 1024;
const RESULT_LIMIT = 6;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const IMPORT_HOSTS = new Set(["upload.wikimedia.org", "thumb.wikimedia.org"]);

interface Candidate {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl: string;
  credit: string;
}

interface WikiPage {
  pageid: number;
  title: string;
  index: number;
  imageinfo?: {
    mime: string;
    url: string;
    thumburl?: string;
    extmetadata?: Record<string, { value: string } | undefined>;
  }[];
}

class SourceUnavailable extends Error {}

function isFreeWikimediaLicense(license: string): boolean {
  if (/(^|[\s-])(nc|nd)(\b|-)/i.test(license)) return false;
  return /^(cc0|cc[\s-]|public domain|pd\b)/i.test(license.trim());
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

async function searchWikimedia(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "800",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "VocabularyApp/1.0 (image picker)" },
  });
  if (!res.ok) throw new SourceUnavailable(`upstream ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const results: Candidate[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !MIME_EXTENSIONS[info.mime]) continue;
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? "";
    if (!isFreeWikimediaLicense(license)) continue;
    const artist = stripHtml(meta.Artist?.value ?? "");
    const imageUrl = info.thumburl ?? info.url;
    results.push({
      id: String(page.pageid),
      title: page.title.replace(/^File:/, "").replace(/\.[^.]+$/, ""),
      previewUrl: imageUrl,
      imageUrl,
      credit: `Wikimedia Commons · ${license}${artist ? ` · ${artist}` : ""}`,
    });
    if (results.length === RESULT_LIMIT) break;
  }
  return results;
}

async function handleImport(rawUrl: string): Promise<Response> {
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return json({ error: "invalid_url" }, 400);
  }
  if (target.protocol !== "https:" || !IMPORT_HOSTS.has(target.hostname)) {
    return json({ error: "host_not_allowed" }, 400);
  }

  const res = await fetch(target, { redirect: "error" });
  if (!res.ok) return json({ error: "source_unavailable" }, 502);

  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const extension = MIME_EXTENSIONS[mime];
  if (!extension) return json({ error: "unsupported_type" }, 415);

  const declaredSize = Number(res.headers.get("content-length") ?? "0");
  if (declaredSize > MAX_BYTES) return json({ error: "too_large" }, 413);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return json({ error: "too_large" }, 413);

  const { createClient } = await import("npm:@supabase/supabase-js@2");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const path = `external/${crypto.randomUUID()}.${extension}`;
  const { error } = await admin.storage
    .from("word-images")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) return json({ error: "storage_failed" }, 500);

  const { data } = admin.storage.from("word-images").getPublicUrl(path);
  return json({ url: data.publicUrl });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const body = (await req.json()) as { action?: string; source?: string; query?: string; url?: string };

    if (body.action === "search") {
      const query = typeof body.query === "string" ? body.query.trim().slice(0, 120) : "";
      if (body.source !== "wikimedia" || !query) return json({ error: "invalid_request" }, 400);
      try {
        return json({ candidates: await searchWikimedia(query) });
      } catch (err) {
        if (err instanceof SourceUnavailable) return json({ error: "source_unavailable" }, 502);
        throw err;
      }
    }

    if (body.action === "import" && typeof body.url === "string") {
      return await handleImport(body.url);
    }

    return json({ error: "invalid_request" }, 400);
  } catch (err) {
    console.error("image-search failed", err);
    return json({ error: "server_error" }, 500);
  }
});
