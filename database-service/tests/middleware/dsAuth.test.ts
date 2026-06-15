import express from 'express';
import request from 'supertest';
import { dsMiddleware } from '../../src/middleware/dsAuth';

const PE_SECRET      = process.env.DS_PE_API_SECRET!;
const MS_SECRET      = process.env.DS_MS_API_SECRET!;
const POSTMAN_SECRET = process.env.DS_POSTMAN_API_SECRET!;

function buildApp() {
  const app = express();
  app.use(dsMiddleware);
  app.get('/test', (req, res) => res.status(200).json({ consumer: req.consumer }));
  return app;
}

describe('dsMiddleware', () => {
  describe('structure', () => {
    it('exports an array of 2 middleware functions', () => {
      expect(Array.isArray(dsMiddleware)).toBe(true);
      expect(dsMiddleware).toHaveLength(2);
      dsMiddleware.forEach(m => expect(typeof m).toBe('function'));
    });
  });

  describe('valid tokens', () => {
    it('accepts PE token and sets req.consumer to PE', async () => {
      const res = await request(buildApp())
        .get('/test')
        .set('Authorization', `Bearer ${PE_SECRET}`);
      expect(res.status).toBe(200);
      expect(res.body.consumer).toBe('PE');
    });

    it('accepts MS token and sets req.consumer to MS', async () => {
      const res = await request(buildApp())
        .get('/test')
        .set('Authorization', `Bearer ${MS_SECRET}`);
      expect(res.status).toBe(200);
      expect(res.body.consumer).toBe('MS');
    });

    it('accepts POSTMAN token in dev environment', async () => {
      const res = await request(buildApp())
        .get('/test')
        .set('Authorization', `Bearer ${POSTMAN_SECRET}`);
      expect(res.status).toBe(200);
      expect(res.body.consumer).toBe('POSTMAN');
    });
  });

  describe('invalid tokens', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(buildApp()).get('/test');
      expect(res.status).toBe(401);
    });

    it('returns 401 when Authorization header lacks Bearer prefix', async () => {
      const res = await request(buildApp())
        .get('/test')
        .set('Authorization', PE_SECRET);
      expect(res.status).toBe(401);
    });

    it('returns 401 for an unrecognised token', async () => {
      const res = await request(buildApp())
        .get('/test')
        .set('Authorization', 'Bearer not-a-real-secret');
      expect(res.status).toBe(401);
    });
  });

  describe('environment blocking', () => {
    it('blocks POSTMAN token in prod and returns 403', async () => {
      jest.resetModules();
      process.env.ENVIRONMENT = 'prod';
      const { dsMiddleware: prodMiddleware } = await import('../../src/middleware/dsAuth');

      const app = express();
      app.use(prodMiddleware);
      app.get('/test', (req, res) => res.status(200).json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${POSTMAN_SECRET}`);
      expect(res.status).toBe(403);

      // Restore
      jest.resetModules();
      process.env.ENVIRONMENT = 'dev';
    });

    it('blocks POSTMAN token in stage and returns 403', async () => {
      jest.resetModules();
      process.env.ENVIRONMENT = 'stage';
      const { dsMiddleware: stageMiddleware } = await import('../../src/middleware/dsAuth');

      const app = express();
      app.use(stageMiddleware);
      app.get('/test', (req, res) => res.status(200).json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Authorization', `Bearer ${POSTMAN_SECRET}`);
      expect(res.status).toBe(403);

      jest.resetModules();
      process.env.ENVIRONMENT = 'dev';
    });
  });
});
