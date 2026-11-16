import fastify from 'fastify'
import sponsorshipPolicyRoutes from '../src/routes/sponsorship-policy-routes.js'

const WALLET_A = '0x1111111111111111111111111111111111111111'
const WALLET_B = '0x2222222222222222222222222222222222222222'
const KEY_A = 'tenant-a-key'
const KEY_B = 'tenant-b-key'
const UNKNOWN_KEY = 'key-that-belongs-to-no-tenant'

const policyBody = (walletAddress: string, name: string) => ({
  walletAddress,
  name,
  description: 'written by the test',
  isApplicableToAllNetworks: false,
  enabledChains: [1],
  supportedEPVersions: ['EPV_07'],
  isPerpetual: true,
})

function makeApp() {
  const app = fastify()
  const policies = new Map<number, any>()
  policies.set(1, {
    id: 1,
    walletAddress: WALLET_B,
    name: 'tenant-b-policy',
    description: '',
    isEnabled: true,
    isApplicableToAllNetworks: false,
    enabledChains: [1],
    supportedEPVersions: ['EPV_07'],
    isPerpetual: true,
    createdAt: new Date(),
  })
  const apiKeys = [
    { apiKey: KEY_A, walletAddress: WALLET_A, supportedNetworks: null },
    { apiKey: KEY_B, walletAddress: WALLET_B, supportedNetworks: null },
  ]
  const writes = { create: 0, update: 0, enable: 0, disable: 0, delete: 0, deleteWhitelist: 0 }

  app.decorate('apiKeyRepository', {
    findOneByApiKey: async (apiKey: string) => apiKeys.find((row) => row.apiKey === apiKey) ?? null,
    findOneByWalletAddress: async (walletAddress: string) => apiKeys.find((row) => row.walletAddress === walletAddress) ?? null,
  })

  app.decorate('sponsorshipPolicyRepository', {
    findOneById: async (id: number) => policies.get(id) ?? null,
    createSponsorshipPolicy: async (dto: any) => {
      writes.create += 1
      const row = { ...dto, id: 2, createdAt: new Date() }
      policies.set(2, row)
      return row
    },
    updateSponsorshipPolicy: async (dto: any) => {
      writes.update += 1
      const row = { ...policies.get(Number(dto.id)), ...dto }
      policies.set(Number(dto.id), row)
      return row
    },
    enableSponsorshipPolicy: async (id: number) => {
      writes.enable += 1
      policies.get(id).isEnabled = true
    },
    disableSponsorshipPolicy: async (id: number) => {
      writes.disable += 1
      policies.get(id).isEnabled = false
    },
    deleteSponsorshipPolicy: async (id: number) => {
      writes.delete += 1
      policies.delete(id)
    },
  })

  app.decorate('whitelistRepository', {
    deleteAllBySponsorshipPolicies: async () => {
      writes.deleteWhitelist += 1
    },
  })

  app.register(sponsorshipPolicyRoutes)
  return { app, policies, writes }
}

const policyState = (policies: Map<number, any>) =>
  JSON.stringify(
    Array.from(policies.values()).map((policy) => ({
      id: policy.id,
      walletAddress: policy.walletAddress,
      name: policy.name,
      isEnabled: policy.isEnabled,
      isApplicableToAllNetworks: policy.isApplicableToAllNetworks,
      enabledChains: policy.enabledChains,
      supportedEPVersions: policy.supportedEPVersions,
      isPerpetual: policy.isPerpetual,
    })),
  )

async function inject(app: any, options: any) {
  try {
    return await app.inject(options)
  } catch (err) {
    // an unpatched handler sends a second reply after the refusal, which rejects inject
    return { statusCode: 0, payload: String(err) }
  }
}

describe('sponsorship policy routes', () => {
  const { app, policies, writes } = makeApp()

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  const routes = [
    {
      name: 'POST /addPolicy',
      request: () => ({ method: 'POST', url: '/addPolicy', payload: policyBody(WALLET_A, 'policy-added-by-the-test') }),
      foreignKey: KEY_B,
    },
    {
      name: 'PUT /updatePolicy',
      request: () => ({ method: 'PUT', url: '/updatePolicy', payload: { id: 1, ...policyBody(WALLET_B, 'tenant-b-policy') } }),
      foreignKey: KEY_A,
    },
    {
      name: 'DELETE /deletePolicy/:id',
      request: () => ({ method: 'DELETE', url: '/deletePolicy/1' }),
      foreignKey: KEY_A,
    },
    {
      name: 'PUT /enablePolicy/:id',
      request: () => ({ method: 'PUT', url: '/enablePolicy/1' }),
      foreignKey: KEY_A,
    },
    {
      name: 'PUT /disablePolicy/:id',
      request: () => ({ method: 'PUT', url: '/disablePolicy/1' }),
      foreignKey: KEY_A,
    },
  ]

  const refusals = [
    { label: 'no apikey header', headers: () => ({}), status: 400 },
    { label: 'a key that belongs to no tenant', headers: () => ({ apikey: UNKNOWN_KEY }), status: 400 },
  ]

  for (const route of routes) {
    for (const refusal of refusals) {
      test(`${route.name} with ${refusal.label} is refused without a write`, async () => {
        const beforePolicies = policyState(policies)
        const beforeWrites = JSON.stringify(writes)
        const response = await inject(app, { ...route.request(), headers: refusal.headers() })
        expect(response.statusCode).toBe(refusal.status)
        expect(policyState(policies)).toBe(beforePolicies)
        expect(JSON.stringify(writes)).toBe(beforeWrites)
      })
    }

    test(`${route.name} with another tenant's key is refused without a write`, async () => {
      const beforePolicies = policyState(policies)
      const beforeWrites = JSON.stringify(writes)
      const response = await inject(app, { ...route.request(), headers: { apikey: route.foreignKey } })
      expect(response.statusCode).toBe(403)
      expect(policyState(policies)).toBe(beforePolicies)
      expect(JSON.stringify(writes)).toBe(beforeWrites)
    })
  }

  test('the tenant can still add a policy with its own key', async () => {
    const response = await inject(app, {
      method: 'POST',
      url: '/addPolicy',
      headers: { apikey: KEY_A },
      payload: policyBody(WALLET_A, 'tenant-a-policy'),
    })
    expect(response.statusCode).toBe(200)
    expect(writes.create).toBe(1)
    expect(policies.get(2).walletAddress).toBe(WALLET_A)
  })

  test('the tenant can still update a policy with its own key', async () => {
    const response = await inject(app, {
      method: 'PUT',
      url: '/updatePolicy',
      headers: { apikey: KEY_B },
      payload: { id: 1, ...policyBody(WALLET_B, 'tenant-b-policy'), enabledChains: [1, 5] },
    })
    expect(response.statusCode).toBe(200)
    expect(writes.update).toBe(1)
    expect(policies.get(1).enabledChains).toEqual([1, 5])
  })

  test('the tenant can still disable and enable a policy with its own key', async () => {
    const disabled = await inject(app, { method: 'PUT', url: '/disablePolicy/1', headers: { apikey: KEY_B } })
    expect(disabled.statusCode).toBe(200)
    expect(policies.get(1).isEnabled).toBe(false)
    const enabled = await inject(app, { method: 'PUT', url: '/enablePolicy/1', headers: { apikey: KEY_B } })
    expect(enabled.statusCode).toBe(200)
    expect(policies.get(1).isEnabled).toBe(true)
    expect(writes.disable).toBe(1)
    expect(writes.enable).toBe(1)
  })

  test('the tenant can still delete a policy with its own key', async () => {
    const response = await inject(app, { method: 'DELETE', url: '/deletePolicy/2', headers: { apikey: KEY_A } })
    expect(response.statusCode).toBe(200)
    expect(writes.delete).toBe(1)
    expect(policies.has(2)).toBe(false)
  })
})
