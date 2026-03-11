import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const AnimeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    synopsis: { type: String, trim: true },
    coverImage: { type: String, trim: true },
    genres: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    seasons: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["upcoming", "airing", "completed", "hiatus"],
      index: true,
    },
    currentSeasonLabel: { type: String, trim: true, index: true },
    releaseDay: { type: String, trim: true },
    nextEpisodeAt: { type: Date, index: true },
    popularityScore: { type: Number, default: 0, index: true },
    isPopularNow: { type: Boolean, default: false, index: true },
    notificationsEnabled: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

export type AnimeDocument = InferSchemaType<typeof AnimeSchema>;

const Anime = (models.Anime as Model<AnimeDocument>) || model<AnimeDocument>("Anime", AnimeSchema);

export default Anime;