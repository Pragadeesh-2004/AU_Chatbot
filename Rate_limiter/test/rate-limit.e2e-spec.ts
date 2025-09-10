import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { RateLimitModule } from '../src/rate_limit/rate-limit.module';
import { ConfigModule } from '@nestjs/config';

describe('Rate Limit (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MongooseModule.forRoot('mongodb://localhost:27017/rate_limiter_test'),
        RateLimitModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/rate-limit (GET)', () => {
    it('should return rate limits', () => {
      return request(app.getHttpServer())
        .get('/rate-limit/organisation')
        .expect(200);
    });
  });

  describe('/rate-limit/organisation (POST)', () => {
    it('should create a rate limit', () => {
      const createRateLimitDto = {
        org_id: '507f1f77bcf86cd799439011',
        max_input_token: 1000,
        max_output_token: 2000,
        file_count: 10,
        file_size: 1000000,
        knowledge_base_count: 5,
        knowledge_base_index_size: 500000,
        active: true,
      };

      return request(app.getHttpServer())
        .post('/rate-limit/organisation')
        .send(createRateLimitDto)
        .expect(201);
    });
  });

  describe('/rate-limit/organisation (DELETE)', () => {
    it('should delete a rate limit', () => {
      return request(app.getHttpServer())
        .delete('/rate-limit/organisation/507f1f77bcf86cd799439011')
        .expect(204);
    });
  });
});