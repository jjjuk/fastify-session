# FastifySession

[![npm version](https://img.shields.io/npm/v/@mgcrea/fastify-session.svg)](https://github.com/mgcrea/fastify-session/releases)
[![license](https://img.shields.io/npm/l/@mgcrea/fastify-session)](https://tldrlegal.com/license/mit-license)
[![build status](https://img.shields.io/github/workflow/status/mgcrea/fastify-session/ci)](https://github.com/mgcrea/fastify-session/actions)
[![dependencies status](https://img.shields.io/david/mgcrea/fastify-session)](https://david-dm.org/mgcrea/fastify-session)
[![devDependencies status](https://img.shields.io/david/dev/mgcrea/fastify-session)](https://david-dm.org/mgcrea/fastify-session?type=dev)

Session plugin for [fastify](https://github.com/fastify/fastify) that supports both stateless and sateful sessions.

- Requires [fastify-cookie](https://github.com/fastify/fastify-cookiek) to handle cookies.

- Can leverage crypto addons like
  [@mgcrea/fastify-session-sodium-crypto](https://github.com/mgcrea/fastify-session-sodium-crypto) to perform crypto.

- Can leverage store addons like
  [@mgcrea/fastify-session-redis-store](https://github.com/mgcrea/fastify-session-redis-store) to store sessions.

- Built with [TypeScript](https://www.typescriptlang.org/) for static type checking with exported types along the
  library.

## Usage

```bash
npm install fastify-cookie @mgcrea/fastify-session --save
# or
yarn add fastify-cookie @mgcrea/fastify-session
```

### Basic example (signed session with hmac stored in a volatile in-memory store)

Defaults to a volatile in-memory store for sessions (great for tests), with
[hmac](https://nodejs.org/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options) for signature.

```ts
import createFastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifySession from '@mgcrea/fastify-session';

const SESSION_SECRET = 'a secret with minimum length of 32 characters';
const SESSION_TTL = 864e3; // 1 day in seconds

export const buildFastify = (options?: FastifyServerOptions): FastifyInstance => {
  const fastify = createFastify(options);

  fastify.register(fastifyCookie);
  fastify.register(fastifySession, {
    secret: SESSION_SECRET,
    cookie: { maxAge: SESSION_TTL },
  });

  return fastify;
};
```

### Production example (signed session with sodium stored in redis)

For better performance/security, you can use the
[@mgcrea/fastify-session-sodium-crypto](https://github.com/mgcrea/fastify-session-sodium-crypto) addon:

Leveraging an external redis store, the session id (generated with [nanoid](https://github.com/ai/nanoid)) is signed
using a secret-key with
[libsodium's crytpo_auth](https://libsodium.gitbook.io/doc/secret-key_cryptography/secret-key_authentication)

```ts
import createFastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifySession from '@mgcrea/fastify-session';
import { SODIUM_AUTH } from '@mgcrea/fastify-session-sodium-crypto';

const SESSION_KEY = 'Egb/g4RUumlD2YhWYfeDlm5MddajSjGEBhm0OW+yo9s='';
const SESSION_TTL = 864e3; // 1 day in seconds
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379/1';

export const buildFastify = (options?: FastifyServerOptions): FastifyInstance => {
  const fastify = createFastify(options);

  fastify.register(fastifyCookie);
  fastify.register(fastifySession, {
    key: Buffer.from(SESSION_KEY, 'base64'),
    crypto: SODIUM_AUTH,
    store: new RedisStore({ client: new Redis(REDIS_URI), ttl: SESSION_TTL }),
    cookie: { maxAge: SESSION_TTL },
  });

  return fastify;
};
```

### Stateless example (encrypted session with sodium not using a store)

No external store required, the entire session data is encrypted using a secret-key with
[libsodium's crypto_secretbox_easy](https://libsodium.gitbook.io/doc/secret-key_cryptography/secretbox)

Here we used a `secret` instead of providing a `key`, key derivation will happen automatically on startup.

```ts
import createFastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifySession from '@mgcrea/fastify-session';
import { SODIUM_SECRETBOX } from '@mgcrea/fastify-session-sodium-crypto';

const SESSION_TTL = 864e3; // 1 day in seconds

export const buildFastify = (options?: FastifyServerOptions): FastifyInstance => {
  const fastify = createFastify(options);

  fastify.register(fastifyCookie);
  fastify.register(fastifySession, {
    secret: 'a secret with minimum length of 32 characters',
    crypto: SODIUM_SECRETBOX,
    cookie: { maxAge: SESSION_TTL },
  });

  return fastify;
};
```

## Benchmarks

### Session crypto sealing

```sh
NODE_PATH=. y ts-node --project test/tsconfig.json test/benchmark/cryptoSeal.ts
```

```
SODIUM_SECRETBOX#sealJson x 333,747 ops/sec ±0.62% (91 runs sampled)
SODIUM_AUTH#sealJson x 376,300 ops/sec ±0.50% (89 runs sampled)
HMAC#sealJson x 264,292 ops/sec ±3.13% (85 runs sampled)
Fastest is SODIUM_AUTH#sealJson
```

### Session crypto unsealing

```sh
NODE_PATH=. y ts-node --project test/tsconfig.json test/benchmark/cryptoUnseal.ts
```

```
SODIUM_SECRETBOX#unsealJson x 424,297 ops/sec ±0.69% (86 runs sampled)
SODIUM_AUTH#unsealJson x 314,736 ops/sec ±0.96% (89 runs sampled)
HMAC#unsealJson x 145,037 ops/sec ±5.67% (78 runs sampled)
Fastest is SODIUM_SECRETBOX#unsealJson
```

## Authors

- [Olivier Louvignes](https://github.com/mgcrea) <<olivier@mgcrea.io>>

### Credits

Heavily inspired from

- [fastify-secure-session](https://github.com/fastify/fastify-secure-session) by
  [Matteo Collina](https://github.com/mcollina)
- [fastify-session](https://github.com/SerayaEryn/fastify-session) by [Denis Fäcke](https://github.com/SerayaEryn)
- [express-session](https://github.com/expressjs/session) by [Douglas Wilson](https://github.com/dougwilson)
- [cookie-signature](https://github.com/tj/node-cookie-signature) by [TJ Holowaychuk](https://github.com/tj)

## License

```
The MIT License

Copyright (c) 2020 Olivier Louvignes <olivier@mgcrea.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
