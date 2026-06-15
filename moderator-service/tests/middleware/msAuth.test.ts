import express from 'express';
import request from 'supertest';
import { msMiddleware } from '../../src/middleware/msAuth';

const PE_SECRET = process.env.MS_PE_API_SECRET!;

function buildApp() {
  const app = express();
  app.use(msMiddleware);
  app.get('/test', (req, res) => res.status(200).json({ consumer: req.consumer }));
  return app;
}

describe('msMiddleware', () => {
  describe('structure', () => {
    it('exports an array of 2 middleware functions', () => {
      expect(Array.isArray(msMiddleware)).toBe(true);
      expect(msMiddleware).toHaveLength(2);
      msMiddleware.forEach(m => expect(typeof m).toBe('function'));
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
        .set('Authorization', 'Bearer wrong-token');
      expect(res.status).toBe(401);
    });
  });
});
