# Library API

The library API will export data or utilities for developing of the Patreon API. The API is accessible on:

```md
https://patreon-docs.ghostrider.workers.dev
```

## Routes

### GET /data

Returns some information about resources and the Patreon API. See the GitHub app for more details and the response body.

### {METHOD} /proxy/{path}

A simple proxy with CORS headers to the patreon API. Forwards the body, headers and method. Replace `{path}` with the route of the Patreon API route: `https://patreon.com/api/oauth2/v2/campaigns` becomes `/proxy/campaigns`.
