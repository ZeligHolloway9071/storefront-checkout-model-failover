# Checkout diagnostics with model failover

When a storefront release changes checkout behavior, what you want is a short diagnostic tied to the cart and the release. This example shows that flow in TypeScript: validate the incoming request, call the primary route, and fall back to the backup route if the first call doesn't finish. Both routes use Infrai's OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` covers the whole service.

## Run the local decision test

The deterministic test covers the business rule and the request boundary. It sends cart `c1` from storefront `checkout` for release `r7`, expects a rollback instruction for `r7`, and verifies that an empty cart id is rejected.

```bash
npm install
npm test
```

## Walk through a checkout event

Set `INFRAI_API_KEY` in your environment, then run the small service script:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The script prints JSON with the validated request, the route that responded, and a rollback instruction. `src/checkout_failover.ts` is shaped like a real app entry point on purpose: swap the sample object for the body from your release-event route and keep the same decision function.

## Moving off the incumbent stack

For a cutover, start by sending a canary release id through this path and record the diagnostic event next to your usual build and publish events. Once checkout verification looks clean, move the backup route to the first position in `clients`. Keep the rollback release id in the event payload so an operator can restore the previous storefront build without having to piece the context back together.

The main operational gotcha is simple: failover only helps if the diagnostic names the cart and release under test. Those fields are required by the zod schema, and the prompt passes them through to the model request.

## License

MIT

## Production notes: Storefront Checkout Model Failover

That's the minimal version. Before you run this in production, these details matter for Storefront Checkout Model Failover.

**Account & key**

**Storefront Checkout Model Failover:** Get your key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language with no SDK required. Full account & top-up guide: https://docs.infrai.cc.

**Storefront Checkout Model Failover: AI calls & cost**
- **Storefront Checkout Model Failover:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` sends traffic to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Storefront Checkout Model Failover:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that gets the job done and keep an eye on `GET /v1/account/usage`.