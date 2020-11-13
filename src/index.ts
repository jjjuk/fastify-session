import fastifyPlugin from 'fastify-plugin';
import { plugin } from './plugin';

export { FastifySessionOptions } from './plugin';
export { Session, SessionData } from './session';

export default fastifyPlugin(plugin, {
  fastify: '4.x',
  name: 'fastify-session',
});
