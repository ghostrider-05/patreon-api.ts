export const openapiUrl = 'https://raw.githubusercontent.com/ghostrider-05/patreon-api-spec/refs/heads/main/specs/openapi.json'
export const openapiPreviewUrl = 'https://raw.githubusercontent.com/ghostrider-05/patreon-api-spec/refs/heads/main/specs/openapi_preview.json'

// eslint-disable-next-line jsdoc/require-jsdoc
export async function fetchOpenAPISchema () {
    return await fetch('https://patreon-docs.ghostrider.workers.dev/proxy', {
        method: 'POST',
        body: JSON.stringify({
            method: 'GET',
            url: openapiUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        }),
    }).then(res => res.json())
}
