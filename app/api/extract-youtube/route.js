import { NextResponse } from "next/server";
import { YoutubeTranscript } from "@danielxceron/youtube-transcript";

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchVideoMeta(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return { title: data.title, author: data.author_name };
    }
  } catch {
    // ignore
  }
  return { title: "", author: "" };
}

async function fetchVideoDescription(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const descMatch = html.match(
      /"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/
    );
    if (descMatch) {
      return descMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .slice(0, 3000);
    }
  } catch {
    // ignore
  }
  return "";
}

async function tryFetchTranscript(videoId) {
  const langPriorities = ["hi", "en", undefined];

  for (const lang of langPriorities) {
    try {
      const config = lang ? { lang } : {};
      const items = await YoutubeTranscript.fetchTranscript(videoId, config);
      if (items && items.length > 0) {
        return items;
      }
    } catch {
      // try next language
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        {
          error:
            "Invalid YouTube URL. Please provide a valid YouTube video link.",
        },
        { status: 400 }
      );
    }

    const [meta, transcriptItems] = await Promise.all([
      fetchVideoMeta(videoId),
      tryFetchTranscript(videoId),
    ]);

    if (!transcriptItems || transcriptItems.length === 0) {
      const description = await fetchVideoDescription(videoId);

      if (description || meta.title) {
        return NextResponse.json({
          videoId,
          title: meta.title,
          author: meta.author,
          transcript: null,
          description: description || "",
          transcriptLength: 0,
          noTranscript: true,
        });
      }

      return NextResponse.json(
        {
          error:
            "Could not extract any data from this video. Please check the URL and try again.",
        },
        { status: 400 }
      );
    }

    const transcript = transcriptItems.map((item) => item.text).join(" ");

    return NextResponse.json({
      videoId,
      title: meta.title,
      author: meta.author,
      transcript,
      transcriptLength: transcript.length,
      noTranscript: false,
    });
  } catch (error) {
    console.error("Extract YouTube error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to extract video data. Please check the URL and try again.",
      },
      { status: 500 }
    );
  }
}
