/**
 * GraphQL Server Setup
 * Apollo Server v4 with Fastify integration
 */

import { ApolloServer, BaseContext } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

interface GraphQLContext extends BaseContext {
  apiKey?: string;
  authToken?: string;
  request?: any;
  reply?: any;
}

export function createGraphQLServer() {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    // Disable persisted queries to fix Railway deployment warning
    persistedQueries: false,
    // Enable introspection for development
    introspection: true,
  });
}
