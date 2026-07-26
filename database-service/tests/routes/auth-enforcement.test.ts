/**
 * Verifies that all migrated routes enforce dsMiddleware (401 without auth)
 * and respond correctly to authenticated requests.
 * Services are mocked — this tests routing and auth, not business logic.
 */
import express, { Request, Response } from 'express';
import request from 'supertest';

const PE = `Bearer ${process.env.DS_PE_API_SECRET}`;

// --- service mocks -----------------------------------------------------------

const mockQuestion = { id: 1, type: 'Truth', question: 'test?', approved: true, banned: false };
const mockUser     = { id: '123', banned: false };
const mockServer   = { id: '456', banned: false };
const mockChallenge = { id: 1, user_id: '123', question_id: 1, server_id: '456' };
const mockVote     = { challenge_id: 1, done_count: 0, failed_count: 0 };
const mockReport   = { id: 1, status: 'PENDING' };
const mockConfig   = { id: 'config', lockdown: false };
const mockStorable = { id: 1, name: 'item' };
const mockAuditRow = { id: 1, entitlement_id: 'ent-1', type: 'create', source: 'gateway', data: {}, created_at: '2026-01-01' };

jest.mock('../../src/services', () => ({
  questionService: {
    getById:  jest.fn().mockResolvedValue(mockQuestion),
    getRandom: jest.fn().mockResolvedValue(mockQuestion),
    create:   jest.fn().mockResolvedValue(mockQuestion),
    search:   jest.fn().mockResolvedValue([mockQuestion]),
    countByUser: jest.fn().mockResolvedValue(1),
    approve:  jest.fn().mockResolvedValue(mockQuestion),
    ban:      jest.fn().mockResolvedValue(mockQuestion),
    update:   jest.fn().mockResolvedValue(mockQuestion),
    banAllByUser: jest.fn().mockResolvedValue(undefined),
    unbanUserBanned: jest.fn().mockResolvedValue(undefined),
  },
  userService: {
    getById: jest.fn().mockResolvedValue(mockUser),
    upsert:  jest.fn().mockResolvedValue(mockUser),
    update:  jest.fn().mockResolvedValue(mockUser),
    ban:     jest.fn().mockResolvedValue(mockUser),
    unban:   jest.fn().mockResolvedValue(mockUser),
    getServerCount: jest.fn().mockResolvedValue(1),
    getOwnedServerCount: jest.fn().mockResolvedValue(1),
    getBannedServerCount: jest.fn().mockResolvedValue(0),
  },
  serverService: {
    getById:      jest.fn().mockResolvedValue(mockServer),
    upsert:       jest.fn().mockResolvedValue(mockServer),
    update:       jest.fn().mockResolvedValue(mockServer),
    delete:       jest.fn().mockResolvedValue(undefined),
    ban:          jest.fn().mockResolvedValue(mockServer),
    unban:        jest.fn().mockResolvedValue(mockServer),
    getUserCount: jest.fn().mockResolvedValue(1),
    getBannedUserCount: jest.fn().mockResolvedValue(0),
    addUser:      jest.fn().mockResolvedValue(undefined),
    removeUser:   jest.fn().mockResolvedValue(undefined),
    banByOwner:   jest.fn().mockResolvedValue(undefined),
    unbanByOwner: jest.fn().mockResolvedValue(undefined),
  },
  challengeService: {
    getById:       jest.fn().mockResolvedValue(mockChallenge),
    create:        jest.fn().mockResolvedValue(mockChallenge),
    getByMessageId: jest.fn().mockResolvedValue(mockChallenge),
    setMessageId:  jest.fn().mockResolvedValue(mockChallenge),
    skip:          jest.fn().mockResolvedValue(mockChallenge),
    update:        jest.fn().mockResolvedValue(mockChallenge),
  },
  voteService: {
    init:        jest.fn().mockResolvedValue(mockVote),
    getVotes:    jest.fn().mockResolvedValue(mockVote),
    vote:        jest.fn().mockResolvedValue(undefined),
    hasUserVoted: jest.fn().mockResolvedValue(false),
    finalise:    jest.fn().mockResolvedValue(mockVote),
  },
  reportService: {
    getById: jest.fn().mockResolvedValue(mockReport),
    list:    jest.fn().mockResolvedValue([mockReport]),
    create:  jest.fn().mockResolvedValue(mockReport),
    update:  jest.fn().mockResolvedValue(mockReport),
  },
  configService: {
    getConfig:  jest.fn().mockResolvedValue(mockConfig),
    setLocked:  jest.fn().mockResolvedValue(mockConfig),
  },
  storableService: {
    list:    jest.fn().mockResolvedValue([mockStorable]),
    getById: jest.fn().mockResolvedValue(mockStorable),
  },
  trackService: {
    track: jest.fn().mockResolvedValue(undefined),
  },
  inventoryService: {
    get:     jest.fn().mockResolvedValue({ qty: 5 }),
    add:     jest.fn().mockResolvedValue({ qty: 6 }),
    consume: jest.fn().mockResolvedValue({ qty: 4 }),
  },
  entitlementService: {
    record: jest.fn().mockResolvedValue(mockAuditRow),
    latestByEntitlementId: jest.fn().mockResolvedValue(null),
    distinctOpenEntitlementIds: jest.fn().mockResolvedValue([]),
    findPurchasableBySkuId: jest.fn().mockResolvedValue({ sku_id: 'sku-1' }),
    hasDrifted: jest.fn().mockReturnValue(false),
  },
}));

// --- helpers -----------------------------------------------------------------

function buildRouteApp(route: { middleware?: any[]; get?: any; post?: any; patch?: any; delete?: any }, path: string) {
  const app = express();
  const middleware = route.middleware ?? [];

  if (route.get)    app.get(path,    ...middleware, (req: Request, res: Response) => void route.get!(req, res));
  if (route.post)   app.post(path,   ...middleware, (req: Request, res: Response) => void route.post!(req, res));
  if (route.patch)  app.patch(path,  ...middleware, (req: Request, res: Response) => void route.patch!(req, res));
  if (route.delete) app.delete(path, ...middleware, (req: Request, res: Response) => void route.delete!(req, res));

  return app;
}

// --- tests -------------------------------------------------------------------

describe('GET /api/v1/ping', () => {
  const { route } = require('../../src/routes/api/v1/ping');
  const app = buildRouteApp(route, '/api/v1/ping');

  it('returns 200 without auth', async () => {
    expect((await request(app).get('/api/v1/ping')).status).toBe(200);
  });
});

describe('GET /api/v1/question/random', () => {
  const { route } = require('../../src/routes/api/v1/question/random');
  const app = buildRouteApp(route, '/api/v1/question/random');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/question/random')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/question/random').set('Authorization', PE)).status).toBe(200);
  });
});

describe('POST /api/v1/question', () => {
  const { route } = require('../../src/routes/api/v1/question/index');
  const app = buildRouteApp(route, '/api/v1/question');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/question')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/question')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/user/:id', () => {
  const { route } = require('../../src/routes/api/v1/user/[id]');
  const app = buildRouteApp(route, '/api/v1/user/:id');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/user/123')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/user/123').set('Authorization', PE)).status).toBe(200);
  });
});

describe('GET /api/v1/server/:id', () => {
  const { route } = require('../../src/routes/api/v1/server/[id]');
  const app = buildRouteApp(route, '/api/v1/server/:id');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/server/456')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/server/456').set('Authorization', PE)).status).toBe(200);
  });
});

describe('GET /api/v1/vote/:id', () => {
  const { route } = require('../../src/routes/api/v1/vote/[id]/index');
  const app = buildRouteApp(route, '/api/v1/vote/:id');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/vote/1')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/vote/1').set('Authorization', PE)).status).toBe(200);
  });
});

describe('GET /api/v1/config', () => {
  const { route } = require('../../src/routes/api/v1/config/index');
  const app = buildRouteApp(route, '/api/v1/config');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/config')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/config').set('Authorization', PE)).status).toBe(200);
  });
});

describe('GET /api/v1/storable', () => {
  const { route } = require('../../src/routes/api/v1/storable/index');
  const app = buildRouteApp(route, '/api/v1/storable');

  it('returns 401 without auth', async () => {
    expect((await request(app).get('/api/v1/storable')).status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    expect((await request(app).get('/api/v1/storable').set('Authorization', PE)).status).toBe(200);
  });
});

describe('POST /api/v1/track', () => {
  const { route } = require('../../src/routes/api/v1/track/index');
  const app = buildRouteApp(route, '/api/v1/track');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/track')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/track')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/entitlement/audit', () => {
  const { route } = require('../../src/routes/api/v1/entitlement/audit');
  const app = buildRouteApp(route, '/api/v1/entitlement/audit');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/entitlement/audit')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 201 with auth and a valid body', async () => {
    const res = await request(app)
      .post('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({ id: 'ent-1', data: { foo: 'bar' } });
    expect(res.status).toBe(201);
  });
});

describe('PATCH /api/v1/entitlement/audit', () => {
  const { route } = require('../../src/routes/api/v1/entitlement/audit');
  const app = buildRouteApp(route, '/api/v1/entitlement/audit');

  it('returns 401 without auth', async () => {
    expect((await request(app).patch('/api/v1/entitlement/audit')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .patch('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with auth and a valid body', async () => {
    const res = await request(app)
      .patch('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({ id: 'ent-1', data: { foo: 'bar' } });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/v1/entitlement/audit', () => {
  const { route } = require('../../src/routes/api/v1/entitlement/audit');
  const app = buildRouteApp(route, '/api/v1/entitlement/audit');

  it('returns 401 without auth', async () => {
    expect((await request(app).delete('/api/v1/entitlement/audit')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .delete('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with auth and a valid body', async () => {
    const res = await request(app)
      .delete('/api/v1/entitlement/audit')
      .set('Authorization', PE)
      .send({ id: 'ent-1', data: { foo: 'bar' } });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/entitlement/reconcile', () => {
  const { route } = require('../../src/routes/api/v1/entitlement/reconcile');
  const app = buildRouteApp(route, '/api/v1/entitlement/reconcile');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/entitlement/reconcile')).status).toBe(401);
  });

  it('returns 400 with auth but missing entitlements array', async () => {
    const res = await request(app)
      .post('/api/v1/entitlement/reconcile')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with auth and a valid body', async () => {
    const res = await request(app)
      .post('/api/v1/entitlement/reconcile')
      .set('Authorization', PE)
      .send({ entitlements: [{ id: 'ent-1', sku_id: 'sku-1' }] });
    expect(res.status).toBe(200);
  });
});
