import handleInteractionRequest from './interactions/'
import { createLinkedRoleRedirect, handleLinkedRolesCallback } from './linked-roles/oauth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { configureApp } from './setup'
import { getPatreonWebhookRoutes, handlePatreonWebhook } from './webhook/webhook'

export default <ExportedHandler<Config.Env>>{
    async fetch(request, env) {
        const { pathname } = new URL(request.url)

        // Uncomment the following path to configure the bot in development
        // Specify all the options that you want to register / edit
        // if (pathname === '/configure') {
        //     await configureApp(env, {})
        // }

        const resources = {
            '/tos': env.urls?.terms_of_service,
            '/privacy': env.urls?.privacy,
            '/source': env.urls?.github,
            '/discord': env.urls?.discord_server,
            '/patreon': env.urls?.patreon,
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
            return await handleInteractionRequest(request, env)
        case '/linked-roles/auth':
            return createLinkedRoleRedirect(env, '/linked-roles/callback')
        case '/linked-roles/callback':
            return handleLinkedRolesCallback(env, request)
        default:
            return new Response()
        }
    }
}
