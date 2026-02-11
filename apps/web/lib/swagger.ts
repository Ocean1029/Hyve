import swaggerJsdoc, { type Options } from 'swagger-jsdoc';
import path from 'path';
import { openApiSchemas } from './swagger-schemas';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hyve API',
      version: '1.0.0',
      description: 'API documentation for Hyve',
    },
    servers: [
      {
        url: process.env.AUTH_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth session cookie for authentication',
        },
      },
      schemas: openApiSchemas as Record<string, unknown>,
    },
  },
  apis: [
    path.join(process.cwd(), 'app/api/**/route.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
