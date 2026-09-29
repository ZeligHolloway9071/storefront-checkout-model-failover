import assert from "node:assert/strict";
import { z } from "zod";

process.env.INFRAI_API_KEY ??= "test-key";
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  return new Response(JSON.stringify({ choices: [{ message: { content: "Check the tax quote." } }] }), {
    headers: { "content-type": "application/json" }
  });
};

try {
  const { diagnoseCheckout } = await import("./checkout_failover.ts");
  const result = await diagnoseCheckout({ cartId: "c1", storefront: "checkout", releaseId: "r7", symptom: "slow tax quote" });
  assert.equal(result.request.cartId, "c1");
  assert.equal(result.rollback, "Restore release r7 after checkout verification fails.");
  assert.equal(result.diagnostics[0]?.message, "Check the tax quote.");
  assert.equal(calls, 1);
  await assert.rejects(diagnoseCheckout({ cartId: "", storefront: "checkout", releaseId: "r7", symptom: "slow tax quote" }), z.ZodError);
  assert.equal(calls, 1);
  console.log("checkout failover decision test passed");
} finally {
  globalThis.fetch = originalFetch;
}
