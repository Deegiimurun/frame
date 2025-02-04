// store electron version
const electron = process.versions.electron

// Mutable type removes readonly attribute from properties so TS doesn't complain when deleting them
type Mutable<T> = {
  -readonly [key in keyof T]?: T[key]
}

// Delete the electron version while requiring Nebula. This allows ipfs-utils to use
// node-fetch instead of electron-fetch - can remove this when ipfs-utils supports ELECTRON_RUN_AS_NODE
// https://github.com/ipfs/js-ipfs-utils/issues/140
const versions = process.versions as Mutable<NodeJS.ProcessVersions>
delete versions.electron

import nebula from 'nebula'

// reinstate original electron version
versions.electron = electron

import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'
import { EventEmitter } from 'stream'

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// all ENS interaction happens on mainnet
const mainnetProvider = new EthereumProvider(proxyConnection)
mainnetProvider.setChain(1)

export default function (provider = mainnetProvider) {
  let ready = provider.isConnected()
  const events = new EventEmitter()

  if (!ready) {
    provider.once('connect', () => {
      ready = true
      events.emit('ready')
    })
  }

  return {
    once: events.once.bind(events),
    ready: () => ready,
    ...nebula(pylonUrl, provider)
  }
}
