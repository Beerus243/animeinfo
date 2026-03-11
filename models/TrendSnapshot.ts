import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const TrendSnapshotSchema = new Schema(
  {
    sourceRows: [
      {
        _id: false,
        label: { type: String, required: true, trim: true },
        count: { type: Number, required: true },
      },
    ],
    topicRows: [
      {
        _id: false,
        label: { type: String, required: true, trim: true },
        count: { type: Number, required: true },
      },
    ],
    liveItems: [
      {
        _id: false,
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        sourceLabel: { type: String, required: true, trim: true },
        publishedAt: { type: Date },
      },
    ],
    capturedAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  },
);

export type TrendSnapshotDocument = InferSchemaType<typeof TrendSnapshotSchema>;

const TrendSnapshot =
  (models.TrendSnapshot as Model<TrendSnapshotDocument>) || model<TrendSnapshotDocument>("TrendSnapshot", TrendSnapshotSchema);

export default TrendSnapshot;