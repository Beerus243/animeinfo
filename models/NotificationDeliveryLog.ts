import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const NotificationDeliveryLogSchema = new Schema(
  {
    channel: { type: String, enum: ["email", "push"], required: true, index: true },
    recipientKey: { type: String, required: true, trim: true, index: true },
    animeSlug: { type: String, required: true, trim: true, index: true },
    episodeAt: { type: Date, required: true, index: true },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  },
);

NotificationDeliveryLogSchema.index(
  { channel: 1, recipientKey: 1, animeSlug: 1, episodeAt: 1 },
  { unique: true, name: "notification_delivery_unique" },
);

export type NotificationDeliveryLogDocument = InferSchemaType<typeof NotificationDeliveryLogSchema>;

const NotificationDeliveryLog =
  (models.NotificationDeliveryLog as Model<NotificationDeliveryLogDocument>) ||
  model<NotificationDeliveryLogDocument>("NotificationDeliveryLog", NotificationDeliveryLogSchema);

export default NotificationDeliveryLog;