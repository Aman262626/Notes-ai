import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

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
        { error: "Invalid YouTube URL. Please provide a valid YouTube video link." },
        { status: 400 }
      );
    }

    const [meta, transcriptItems] = await Promise.all([
      fetchVideoMeta(videoId),
      YoutubeTranscript.fetchTranscript(videoId, { lang: "hi" }).catch(() =>
        YoutubeTranscript.fetchTranscript(videoId).catch(() => null)
      ),
    ]);

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract transcript from this video. The video may not have captions/subtitles enabled.",
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
    });
  } catch (error) {
    console.error("Extract YouTube error:", error);
    return NextResponse.json(
      { error: "Failed to extract video data. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
