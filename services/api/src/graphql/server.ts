/**
 * GraphQL Server Setup
 * Apollo Server with Fastify integration
 */

import {ApolloServer} from '@apollo/server';
import {typeDefs} from './schema';
import {resolvers} from './resolvers';

export function createGraphQLServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    // Note: context is provided via @as-integrations/fastify in index.ts
  });
}
