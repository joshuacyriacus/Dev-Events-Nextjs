import mongoose, { type HydratedDocument, type Model } from "mongoose";

export type EventMode = "online" | "offline" | "hybrid" | (string & {});

export interface Event {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // normalized to ISO date (YYYY-MM-DD)
  time: string; // normalized to HH:mm or HH:mm-HH:mm (24h)
  mode: EventMode;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type EventDocument = HydratedDocument<Event>;

/**
 * Checks whether a value is a string containing at least one non-whitespace character.
 *
 * @param value - The value to test
 * @returns `true` if `value` is a string with at least one non-whitespace character, `false` otherwise
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Creates a URL-friendly slug from the given string.
 *
 * @param input - The source string to convert into a slug.
 * @returns A lowercase slug containing only letters, numbers, and single dashes, without leading or trailing dashes.
 */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    // Convert anything that's not a letter/number to a dash.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Normalize a date string to the stable ISO date format YYYY-MM-DD (UTC).
 *
 * @param input - A date string in YYYY-MM-DD or any format parseable by Date
 * @returns The date formatted as `YYYY-MM-DD` in UTC
 * @throws Error if `input` cannot be parsed as a valid date
 */
function normalizeISODate(input: string): string {
  const raw = input.trim();

  // If it's already YYYY-MM-DD, keep it.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date. Provide a valid date string.");
  }

  // Store date-only (UTC) in a stable ISO format.
  return parsed.toISOString().slice(0, 10);
}

/**
 * Converts a single time token into normalized 24-hour `HH:mm` format.
 *
 * Accepts either 24-hour `HH:mm` or 12-hour `h:mm AM/PM` (case-insensitive) and returns the equivalent zero-padded `HH:mm`.
 *
 * @param part - A single time string in `HH:mm` or `h:mm AM/PM` format
 * @returns The normalized time in `HH:mm` (24-hour) format
 * @throws Error if `part` is not a valid 24-hour `HH:mm` or 12-hour `h:mm AM/PM` string
 */
function normalizeTimePart(part: string): string {
  const raw = part.trim();

  // 24h HH:mm
  const hhmm = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (hhmm) return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;

  // 12h h:mm AM/PM
  const ampm = raw.match(/^([1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = ampm[2];
    const meridiem = ampm[3].toUpperCase();

    if (meridiem === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  throw new Error(
    "Invalid time. Use HH:mm, h:mm AM/PM, or a range like '09:00-17:00'.",
  );
}

/**
 * Normalize a time or time range into 24-hour `HH:mm` format.
 *
 * Accepts a single time (e.g., `09:00`, `9:00 AM`) or a range separated by `-`, `–`, or `—` (e.g., `9:00 AM - 6:00 PM`).
 *
 * @param input - The time string or range to normalize
 * @returns The normalized time as `HH:mm` or a range `HH:mm-HH:mm`
 * @throws Error if the input is not a valid time or time range
 */
function normalizeTime(input: string): string {
  const raw = input.trim();

  // Support ranges like "9:00 AM - 6:00 PM" / "09:00-17:00".
  const parts = raw
    .split(/\s*(?:-|–|—)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 1) return normalizeTimePart(parts[0]);
  if (parts.length === 2) {
    return `${normalizeTimePart(parts[0])}-${normalizeTimePart(parts[1])}`;
  }

  throw new Error(
    "Invalid time. Use HH:mm, h:mm AM/PM, or a single '-' separated range.",
  );
}

/**
 * Validate that a value is a non-empty array of non-blank strings.
 *
 * @param arr - The value to validate
 * @returns `true` if `arr` is an array with at least one element and every element is a string containing one or more non-whitespace characters, `false` otherwise.
 */
function nonEmptyStringArrayValidator(arr: unknown): boolean {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.every((v) => typeof v === "string" && v.trim().length > 0)
  );
}

const EventSchema = new mongoose.Schema<Event>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "title is required",
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "description is required",
      },
    },
    overview: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "overview is required",
      },
    },
    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "image is required",
      },
    },
    venue: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "venue is required",
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "location is required",
      },
    },
    date: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "date is required",
      },
    },
    time: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "time is required",
      },
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "mode is required",
      },
    },
    audience: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "audience is required",
      },
    },
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: nonEmptyStringArrayValidator,
        message: "agenda must be a non-empty array of strings",
      },
    },
    organizer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isNonEmptyString,
        message: "organizer is required",
      },
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: nonEmptyStringArrayValidator,
        message: "tags must be a non-empty array of strings",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

EventSchema.index({ slug: 1 }, { unique: true });

EventSchema.pre("save", async function preSave(this: EventDocument) {
  // Only regenerate the slug when the title changes.
  if (this.isModified("title")) {
    const base = slugify(this.title);
    if (!base) throw new Error("Unable to generate slug from title");

    // Ensure uniqueness by adding a numeric suffix if needed.
    const Model = this.constructor as Model<Event>;
    const existing = await Model.find({
      _id: { $ne: this._id },
      slug: new RegExp(`^${base}(?:-\\d+)?$`),
    })
      .select("slug")
      .lean();

    let candidate = base;
    if (existing.length > 0) {
      const taken = new Set(existing.map((d) => d.slug));
      let i = 1;
      while (taken.has(candidate)) {
        candidate = `${base}-${i}`;
        i += 1;
      }
    }

    this.slug = candidate;
  }

  // Normalize date/time to consistent formats to keep the DB clean.
  if (this.isModified("date")) this.date = normalizeISODate(this.date);
  if (this.isModified("time")) this.time = normalizeTime(this.time);
});

export const Event: Model<Event> =
  (mongoose.models.Event as Model<Event> | undefined) ??
  mongoose.model<Event>("Event", EventSchema);