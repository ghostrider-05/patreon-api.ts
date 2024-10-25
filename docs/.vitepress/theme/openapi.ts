import { exec } from 'node:child_process'

// eslint-disable-next-line jsdoc/require-jsdoc
export async function fetchOpenAPISchema () {
    return await fetch('https://patreon-docs.ghostrider.workers.dev/proxy', {
        method: 'POST',
        body: JSON.stringify({
            method: 'GET',
            url: openAPIUrlV2,
            headers: {
                'Content-Type': 'application/json',
            },
        }),
    }).then(res => res.json())
}

const getBranch = () => new Promise<string>((resolve, reject) => {
    return exec('git rev-parse --abbrev-ref HEAD', (err, stdout) => {
        if (err)
            reject(`getBranch Error: ${err}`)
        else if (typeof stdout === 'string')
            resolve(stdout.trim())
    })
})

export const currentBranch = await getBranch()

export const openAPIUrlV2 = `https://raw.githubusercontent.com/ghostrider-05/patreon-api.ts/refs/heads/${currentBranch}/src/schemas/v2/generated/openapi.json`
