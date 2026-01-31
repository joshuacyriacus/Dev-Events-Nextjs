import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/database/event.model";
import { NextResponse, type NextRequest } from "next/server";

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: rawSlug } = await params;

    if (!rawSlug || typeof rawSlug !== "string") {
      return NextResponse.json(
        { message: "Missing required route parameter: slug" },
        { status: 400 }
      );
    }

    const slug = decodeURIComponent(rawSlug).trim().toLowerCase();

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { message: "Invalid slug format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findOne({ slug }).exec();

    if (!event) {
      return NextResponse.json(
        { message: `Event not found for slug: ${slug}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { event: event.toObject() },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/events/[slug] failed", err);
    return NextResponse.json(
      {
        message: "Unexpected error while fetching event",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

