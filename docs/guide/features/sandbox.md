# Testing & sandbox

Since the Patreon API is readonly, you can mock responses to test if your application works.

## Testing & Mocking

### Random data

### Cache

## Frameworks

### MockAgent

To intercept a request to the Patreon API you can use undici's [`MockAgent` API](https://undici.nodejs.org/#/docs/api/MockAgent) to mock API responses.

:::code-group

<<< @/examples/mock/agent.ts#mock-agent{ts twoslash} [Cache or random data]

<<< @/examples/mock/agent.ts#mock-agent-response{ts twoslash} [Custom response]

:::

### MSW

<<< @/examples/mock/msw.ts{ts twoslash}

### Other

Is there another popular testing / mocking framework that uses a completely different API? Open an issue on GitHub to add new mocking functionality and/or guides.

## Webhooks
