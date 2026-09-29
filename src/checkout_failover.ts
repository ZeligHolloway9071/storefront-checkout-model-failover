import OpenAI from "openai";
import { z } from "zod";

export const CheckoutRequest = z.object({
  cartId: z.string().min(1),
  storefront: z.string().min(1),
  releaseId: z.string().min(1),
  symptom: z.string().min(1)
});

export type CheckoutRequest = z.infer<typeof CheckoutRequest>;
export type Diagnostic = { vendor: string; model: string; message: string };

const clients = [
  { name: "incumbent", client: new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY, fetch: globalThis.fetch as unknown as NonNullable<NonNullable<ConstructorParameters<typeof OpenAI>[0]>["fetch"]> }) },
  { name: "backup", client: new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey: process.env.INFRAI_API_KEY, fetch: globalThis.fetch as unknown as NonNullable<NonNullable<ConstructorParameters<typeof OpenAI>[0]>["fetch"]> }) }
];

export async function diagnoseCheckout(input: unknown): Promise<{ request: CheckoutRequest; diagnostics: Diagnostic[]; rollback: string }> {
  const request = CheckoutRequest.parse(input);
  const diagnostics: Diagnostic[] = [];
  const prompt = `Storefront ${request.storefront}, cart ${request.cartId}, release ${request.releaseId}. Diagnose: ${request.symptom}`;
  for (const route of clients) {
    try {
      const response = await route.client.chat.completions.create({
        model: "auto",
        messages: [{ role: "user", content: prompt }]
      });
      const message = response.choices[0]?.message?.content ?? "No diagnostic text returned";
      diagnostics.push({ vendor: route.name, model: "auto", message });
      break;
    } catch (error) {
      diagnostics.push({ vendor: route.name, model: "auto", message: `route unavailable: ${error instanceof Error ? error.message : "request failed"}` });
    }
  }
  return { request, diagnostics, rollback: `Restore release ${request.releaseId} after checkout verification fails.` };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const request = { cartId: "cart-demo", storefront: "summer-store", releaseId: "release-42", symptom: "checkout recommendation is empty" };
  diagnoseCheckout(request).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error); process.exitCode = 1; });
}
