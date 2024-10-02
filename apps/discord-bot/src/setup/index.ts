import { configureDiscordBot, type ConfigureDiscordOptions } from './discord'
import { configurePatreon, type ConfigurePatreonOptions } from './patreon'
import { validateSecrets } from './secrets'

interface ConfigureOptions {
    discord: ConfigureDiscordOptions
    patreon: ConfigurePatreonOptions
}

// eslint-disable-next-line jsdoc/require-jsdoc
export async function configureApp (env: Config.Env, options: ConfigureOptions) {
    validateSecrets(env)

    await configureDiscordBot(env, options.discord)
    await configurePatreon(env, options.patreon)
}
