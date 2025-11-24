// #region config
import { EventEmitter } from 'node:events'
import { PatreonCreatorClient, type RestEventMap } from 'patreon-api.ts'

const emitter = new EventEmitter<RestEventMap>()

emitter.on('request', data => {
    console.log('Sent a new request to', data.url)
})

emitter.on('response', data => {
    console.log('Received a response with status', data.status)
})

const client = new PatreonCreatorClient({
    oauth: {
        clientId: 'id',
        clientSecret: 'secret',
    },
    rest: {
        emitter,
    },
})
// #endregion config
console.log(client.name)
