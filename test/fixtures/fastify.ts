import createFastify, { FastifyInstance, FastifyLoggerOptions, FastifyServerOptions } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifySession, { FastifySessionOptions } from 'src/index';
import 'src/typings/fastify';

type BuilfFastifyOptions = FastifyServerOptions & { session?: FastifySessionOptions };

const logger: FastifyLoggerOptions = {
  level: 'debug',
  prettyPrint: {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    levelFirst: true,
  },
};

export const buildFastify = (options: BuilfFastifyOptions = {}): FastifyInstance => {
  const { session: sessionOptions, ...fastifyOptions } = options;
  const fastify = createFastify({ logger, ...fastifyOptions });

  fastify.register(fastifyCookie);
  fastify.register(fastifySession, sessionOptions);

  fastify.post('/', (request, reply) => {
    request.session.set('data', request.body);
    reply.send('hello world');
  });
  fastify.post('/auth', (request, reply) => {
    request.session.set('data', request.body);
    reply.send('hello world');
  });
  fastify.post('/update', (request, reply) => {
    request.session.set('update', request.body);
    reply.send('hello world');
  });
  fastify.post('/touch', (request, reply) => {
    request.session.touch();
    reply.send('hello world');
  });
  fastify.get('/session', async (request) => {
    return { id: request.session.id, data: request.session.data, expiry: request.session.expiry };
  });
  fastify.post('/noop', async () => {
    return { ok: 1 };
  });
  fastify.post('/q', async (request) => {
    const sessionId = encodeURIComponent(await request.session.toCookie());
    request.session.set('data', request.body);
    return { token: sessionId };
  });

  const schema = {
    body: {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    },
  };
  fastify.post('/schema', { schema }, (request, reply) => {
    request.session.set('data', request.body);
    reply.send('hello world');
  });
  fastify.get('/', (request, reply) => {
    const data = request.session.get('data');
    if (!data) {
      reply.code(404).send();
      return;
    }
    reply.send(data);
  });
  fastify.get('/raw', (request, reply) => {
    const data = request.session.data;
    reply.send(data);
  });
  return fastify;
};

export const waitFor = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
