import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const SourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    feedUrl: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: "en", trim: true },
    active: { type: Boolean, default: true },
    category: { type: String, trim: true },
    mapping: {
      category: { type: String, trim: true },
      defaultTags: [{ type: String, trim: true }],
    },
  },
  {
    timestamps: true,
  },
);

export type SourceDocument = InferSchemaType<typeof SourceSchema>;

const Source = (models.Source as Model<SourceDocument>) || model<SourceDocument>("Source", SourceSchema);

export default Source;