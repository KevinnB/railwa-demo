import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

type Auth = typeof auth;
type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
  interface FastifyRequest {
    session: Session;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest("session", null as unknown as Session);

  // Better Auth catch-all route
  fastify.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    schema: { hide: true },
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(request.headers)) {
          if (value) headers.append(key, String(value));
        }

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          ...(request.body ? { body: JSON.stringify(request.body) } : {}),
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));

        const text = await response.text();
        reply.send(text || null);
      } catch (error) {
        fastify.log.error(error, "Auth handler error");
        reply.status(500).send({ error: "Internal authentication error" });
      }
    },
  });

  // Reusable auth guard preHandler
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      reply.status(401).send({ error: "Unauthorized" });
      return;
    }

    request.session = session;
  };

  fastify.decorate("authenticate", authenticate);
}

export default fp(authPlugin, { name: "auth", dependencies: ["db"] });
