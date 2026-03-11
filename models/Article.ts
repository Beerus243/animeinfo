import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const LocalizedSeoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDesc: { type: String, trim: true },
    ogImage: { type: String, trim: true },
  },
  { _id: false },
);

const LocalizedArticleSchema = new Schema(
  {
    slug: { type: String, trim: true },
    title: { type: String, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, default: "" },
    seo: { type: LocalizedSeoSchema, default: () => ({}) },
  },
  { _id: false },
);

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    originalTitle: { type: String, trim: true },
    originalUrl: { type: String, required: true, index: true },
    importKey: { type: String, trim: true },
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
    aiStatus: {
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending",
      index: true,
    },
    aiError: { type: String, trim: true },
    aiProcessedAt: { type: Date },
    aiRewritten: { type: Boolean, default: false },
    sourceName: { type: String, trim: true },
    publishedAt: { type: Date },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDesc: { type: String, trim: true },
      ogImage: { type: String, trim: true },
    },
    localizations: {
      fr: { type: LocalizedArticleSchema, default: () => ({}) },
      en: { type: LocalizedArticleSchema, default: () => ({}) },
    },
  },
  {
    timestamps: true,
  },
);

ArticleSchema.index({ importKey: 1 }, { unique: true, sparse: true });

export type ArticleDocument = InferSchemaType<typeof ArticleSchema>;

const Article = (models.Article as Model<ArticleDocument>) || model<ArticleDocument>("Article", ArticleSchema);

export default Article;