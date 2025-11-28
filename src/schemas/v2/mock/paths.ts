import paths from '../api/paths'
import type { Route } from '../api/types'

export type PatreonMockRouteId = typeof paths[number]['methods'][number]['id']

// eslint-disable-next-line jsdoc/require-jsdoc
function getAPIRoutesWithRegex (routes: Route[]) {
    const escapeDots = (s: string) => Array.from(s, c => c === '.' ? '\\.' : c).join('')

    return routes.map(o => ({
        route: o,
        exp: new RegExp(`^${o.route(':id')
            .split('/')
            .map((s: string) => s.startsWith(':') ? '[^\\/]+': escapeDots(s))
            .join('\\/')
        }$`),
    }))
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function findAPIPath (path: string, options: {
    apiPath: string
}) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pathWithoutQuery = path.split('?')[0]!
    const regexs = getAPIRoutesWithRegex(paths)

    const route = regexs.find(reg => {
        return reg.exp.test(pathWithoutQuery)
            || reg.exp.test(pathWithoutQuery.slice(options.apiPath.length))
    })?.route
    if (!route) return
    const routeId = route.route(':id')

    return {
        param: pathWithoutQuery.split('/').find((_, i) => routeId.split('/')[i] === ':id'),
        routeId,
        path: route,
    }
}
