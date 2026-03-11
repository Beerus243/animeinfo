import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    originalTitle: { type: String, trim: true },
    originalUrl: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, trim: true },
    content: { type: String, default: "" },
    coverImage: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    anime: { type: String, trim: true, index: true },
    tags: [{ type: String, trim: true }],
    section: {
      type: String,
      enum: ["news", "recommendation"],
      default: "news",
      index: true,
    },
    recommendationType: {
      type: String,
      enum: ["anime", "manga"],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "review", "published"],
      default: "draft",
      index: true,
    },
    aiRewritten: { type: Boolean, default: false },
    sourceName: { type: String, trim: true },
    publishedAt: { type: Date },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDesc: { type: String, trim: true },
      ogImage: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

export type ArticleDocument = InferSchemaType<typeof ArticleSchema>;

const Article = (models.Article as Model<ArticleDocument>) || model<ArticleDocument>("Article", ArticleSchema);

export default Article;