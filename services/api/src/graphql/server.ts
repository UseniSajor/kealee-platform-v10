/**
 * GraphQL Server Setup
 * Apollo Server v4 with Fastify integration
 */

import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

export function createGraphQLServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    // Disable persisted queries to fix Railway deployment warning
    persistedQueries: false,
    // Enable introspection for development
    introspection: true,
  });
}
