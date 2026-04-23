import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    console.log(`[Polar Webhook] Received event: ${payload.type}`);

    switch (payload.type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.revoked":
        // Handle subscription changes if needed (e.g. updating local cache)
        console.log(`Subscription event for customer ${payload.data.customerId}`);
        break;
      case "order.created":
        console.log(`Order created for customer ${payload.data.customerId}`);
        break;
      default:
        console.log(`Unhandled event type: ${payload.type}`);
    }
  }
});
