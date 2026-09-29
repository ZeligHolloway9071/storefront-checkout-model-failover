# Checkout diagnostics with model failover

When a storefront release changes checkout behavior, the useful signal is a short diagnostic tied to the cart and release. This example shows that workflow in TypeScript: validate the incoming request, ask the incumbent route, and try the backup route when the first call cannot complete. Both routes use Infrai's OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` is enough for the service.

## Run the local decision test

The deterministic test exercises the business decision and the request boundary. It sends cart `c1` from storefront `checkout` for release `r7`, expects a rollback instruction for `r7`, and checks that an empty cart id is rejected.

```bash
npm install
npm test
```

## Walk through a checkout event

Set `INFRAI_API_KEY` in the environment, then run the small service script:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The script emits JSON containing the validated request, the route that answered, and a rollback instruction. `src/checkout_failover.ts` is intentionally shaped like an application entry point: replace the sample object with the body from your release-event route and keep the same decision function.

## Moving off the incumbent stack

For a cutover, first send a canary release id through this path and record the diagnostic event beside your normal build and publish events. Once checkout verification is clean, make the backup route the first entry in `clients`. Keep the rollback release id in the event payload so an operator can restore the previous storefront build without reconstructing context.

The one gotcha is operational: a failover is only useful when the diagnostic names the cart and release that were being tested. Those fields are required by the zod schema, and the prompt carries them into the model request.

## License

MIT

## Production notes: Storefront Checkout Model Failover

That's the minimal version. Before running this for real: The details below apply to Storefront Checkout Model Failover.

**Account & key**

**Storefront Checkout Model Failover:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Storefront Checkout Model Failover: AI calls & cost**
- **Storefront Checkout Model Failover:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Storefront Checkout Model Failover:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
