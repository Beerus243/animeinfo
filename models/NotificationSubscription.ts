import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const NotificationSubscriptionSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    animeSlugs: [{ type: String, trim: true, index: true }],
    locale: { type: String, trim: true },
    sourcePage: { type: String, trim: true },
    notifyOnRelease: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
    lastNotifiedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export type NotificationSubscriptionDocument = InferSchemaType<typeof NotificationSubscriptionSchema>;

const NotificationSubscription =
  (models.NotificationSubscription as Model<NotificationSubscriptionDocument>) ||
  model<NotificationSubscriptionDocument>("NotificationSubscription", NotificationSubscriptionSchema);

export default NotificationSubscription;