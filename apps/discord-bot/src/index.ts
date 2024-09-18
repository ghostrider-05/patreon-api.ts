import { Config } from './types'

import handleInteractionRequest from './interactions/'
import { getPatreonWebhookRoutes, handlePatreonWebhook } from './webhook/webhook'

export default <ExportedHandler<Config.Env>>{
    async fetch(request, env) {
        const { pathname } = new URL(request.url)

        const resources = {
            '/tos': env.tos_url,
            '/privacy': env.privacy_url,
            '/source': env.github_url,
        }

        if (resources[pathname] != undefined) {
            return Response.redirect(resources[pathname])
        }

        const webhookRoutes = getPatreonWebhookRoutes(env.campaigns)
        if (webhookRoutes.includes(pathname)) {
            return await handlePatreonWebhook(request, env)
        }

        switch (pathname) {
            case '/interactions':
                return await handleInteractionRequest(request)
            case '/linked-roles':
            default:
                return new Response()
        }
    }
}
