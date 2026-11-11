// AI image generation via Cloudflare Workers AI (Stable Diffusion XL)
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

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const MODEL_PATH = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
const NEGATIVE_PROMPT =
  "illustration, drawing, cartoon, anime, painting, sketch, text, letters, words, typography, watermark, signature, numbers, blurry, low quality";
const RETRYABLE_STATUSES = new Set([429, 502, 503]);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface RequestBody {
  finnish?: string;
  turkish?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { finnish, turkish } = (await req.json()) as RequestBody;
    if (!finnish || !turkish) {
      return json({ error: "finnish and turkish are required" }, 400);
    }

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    if (!accountId || !apiToken) {
      return json({ error: "cloudflare_not_configured" }, 500);
    }

    const prompt = `A photorealistic, high-quality, realistic photograph representing the concept of '${turkish.trim()}'. Natural lighting, sharp focus, 8k resolution, detailed textures.`;

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL_PATH}`;
    let cfResponse: Response | null = null;
    let responseContentType = "";
    let responseBuffer = new Uint8Array();
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      cfResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, negative_prompt: NEGATIVE_PROMPT }),
      });
      responseContentType = cfResponse.headers.get("content-type") ?? "";
      responseBuffer = new Uint8Array(await cfResponse.arrayBuffer());
      if (!RETRYABLE_STATUSES.has(cfResponse.status) || attempt === MAX_RETRIES) break;
      await wait(RETRY_DELAY_MS);
    }
    if (!cfResponse) {
      return json({ error: "image_generation_failed" }, 502);
    }
    if (!cfResponse.ok) {
      const responseText = new TextDecoder().decode(responseBuffer);
      console.error("Cloudflare AI error", cfResponse.status, responseText);
      return json({ error: "image_generation_failed" }, 502);
    }

    let imageBuffer: Uint8Array;
    let contentType = "image/jpeg";
    if (responseContentType.includes("application/json")) {
      let responseData: { result?: { image?: string } };
      try {
        responseData = JSON.parse(new TextDecoder().decode(responseBuffer)) as { result?: { image?: string } };
      } catch {
        console.error("Cloudflare AI returned invalid JSON");
        return json({ error: "invalid_image_response" }, 502);
      }

      const base64Image = responseData.result?.image;
      if (!base64Image) {
        console.error("Cloudflare AI response did not contain result.image");
        return json({ error: "empty_image" }, 502);
      }

      try {
        const binary = atob(base64Image);
        imageBuffer = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      } catch {
        console.error("Cloudflare AI returned invalid base64 image data");
        return json({ error: "invalid_image_data" }, 502);
      }
    } else if (responseContentType.startsWith("image/")) {
      imageBuffer = responseBuffer;
      contentType = responseContentType.split(";")[0];
    } else {
      console.error("Cloudflare AI returned an unsupported response type", responseContentType);
      return json({ error: "invalid_image_response" }, 502);
    }

    if (imageBuffer.byteLength === 0) {
      return json({ error: "empty_image" }, 502);
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const extension = contentType === "image/png" ? "png" : "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const path = `ai/${fileName}`;
    const { error: uploadError } = await admin.storage
      .from("word-images")
      .upload(path, imageBuffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("Storage upload error", uploadError);
      return json({ error: "storage_failed" }, 500);
    }

    const { data } = admin.storage.from("word-images").getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (err) {
    console.error("generate-word-image failed", err);
    return json({ error: "server_error" }, 500);
  }
});


