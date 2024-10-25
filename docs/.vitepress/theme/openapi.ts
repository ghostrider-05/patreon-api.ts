// eslint-disable-next-line jsdoc/require-jsdoc
export async function fetchOpenAPISchema (branch: string) {
    return await fetch('https://patreon-docs.ghostrider.workers.dev/proxy', {
        method: 'POST',
        body: JSON.stringify({
            method: 'GET',
            url: openAPIUrlV2(branch),
            headers: {
                'Content-Type': 'application/json',
            },
        }),
    }).then(res => res.json())
}

export const openAPIUrlV2 = (branch: string) => {
    return `https://raw.githubusercontent.com/ghostrider-05/patreon-api.ts/refs/heads/${branch}/src/schemas/v2/generated/openapi.json`
}
