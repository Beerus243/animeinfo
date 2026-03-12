import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const WebPushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true, trim: true, unique: true, index: true },
    expirationTime: { type: Number, default: null },
    keys: {
      p256dh: { type: String, required: true, trim: true },
      auth: { type: String, required: true, trim: true },
    },
    animeSlugs: [{ type: String, trim: true, index: true }],
    locale: { type: String, trim: true },
    sourcePage: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    lastNotifiedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export type WebPushSubscriptionDocument = InferSchemaType<typeof WebPushSubscriptionSchema>;

const WebPushSubscription =
  (models.WebPushSubscription as Model<WebPushSubscriptionDocument>) ||
  model<WebPushSubscriptionDocument>("WebPushSubscription", WebPushSubscriptionSchema);

export default WebPushSubscription;