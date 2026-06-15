import express, { Request, Response } from 'express';
import request from 'supertest';

const PE = `Bearer ${process.env.MS_PE_API_SECRET}`;

jest.mock('../../src/services', () => ({
  reportService: { createReport: jest.fn().mockResolvedValue({ id: 1 }) },
  questionService: { setMessageId: jest.fn().mockResolvedValue(undefined) },
}));

function buildRouteApp(route: { middleware?: any[]; get?: any; post?: any }, path: string) {
  const app = express();
  const middleware = route.middleware ?? [];
  if (route.get)  app.get(path,  ...middleware, (req: Request, res: Response) => void route.get!(req, res));
  if (route.post) app.post(path, ...middleware, (req: Request, res: Response) => void route.post!(req, res));
  return app;
}

describe('POST /api/v1/report', () => {
  const { route } = require('../../src/routes/api/v1/report');
  const app = buildRouteApp(route, '/api/v1/report');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/report')).status).toBe(401);
  });

  it('returns 400 with auth but missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/report')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/question', () => {
  const { route } = require('../../src/routes/api/v1/question');
  const app = buildRouteApp(route, '/api/v1/question');

  it('returns 401 without auth', async () => {
    expect((await request(app).post('/api/v1/question')).status).toBe(401);
  });

  it('returns 400 with auth but missing questionId', async () => {
    const res = await request(app)
      .post('/api/v1/question')
      .set('Authorization', PE)
      .send({});
    expect(res.status).toBe(400);
  });
});
