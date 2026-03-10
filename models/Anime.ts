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
  },
  {
    timestamps: true,
  },
);

export type AnimeDocument = InferSchemaType<typeof AnimeSchema>;

const Anime = (models.Anime as Model<AnimeDocument>) || model<AnimeDocument>("Anime", AnimeSchema);

export default Anime;