/**
 * GraphQL Server Setup
 * Apollo Server with Fastify integration
 */

import {ApolloServer} from 'apollo-server-fastify';
import {typeDefs} from './schema';
import {resolvers} from './resolvers';

export function createGraphQLServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: async (request: any) => {
      // Extract API key or auth token from request
      const apiKey = request.request?.headers?.['x-api-key'];
      const authToken = request.request?.headers?.authorization;

      return {
        apiKey,
        authToken,
        request,
      };
    },
    subscriptions: {
      path: '/graphql',
      onConnect: (connectionParams: any) => {
        // Validate connection
        return {
          apiKey: connectionParams['x-api-key'],
        };
      },
    },
  });
}
