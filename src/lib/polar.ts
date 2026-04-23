import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

/**
 * Reports character usage to Polar for metering.
 * @param customerId The internal userId or orgId mapped to Polar customer_id
 * @param characters Number of characters consumed in this generation
 */
export async function trackUsage(customerId: string, characters: number) {
  try {
    await polar.events.ingest({
      events: [
        {
          name: "tts.generation",
          customerId: customerId,
          metadata: { characters },
        }
      ]
    });
    console.log(`[Polar] Tracked ${characters} chars for ${customerId}`);
  } catch (error) {
    console.error("[Polar] Failed to track usage:", error);
    // Don't throw, we don't want to block the user experience due to a billing reporting failure
  }
}
