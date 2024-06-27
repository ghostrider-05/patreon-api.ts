// Replace this with your own html -> markdown function
/**
 * Convert HTML to markdown
 * @param html The HTML to convert
 * @param key The API key connected to your GitHub account
 * @returns The created markdown
 */
export async function renderPost (html: string, key: string): Promise<string> {
    // Return if the post description is empty
    if (html.length === 0) return ''

    return await fetch('https://api.html-to-markdown.com/v1/convert', {
        method: 'POST',
        body: html,
        headers: {
            'Content-Type': 'text/html',
            'Accept': 'text/markdown',
            'X-API-Key': key,
        }
    }).then(res => res.text())
}
