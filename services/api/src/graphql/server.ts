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
    // NOTE: GraphQL Subscriptions are currently disabled
    // Apollo Server v3 with Fastify requires a separate WebSocket server for subscriptions
    // The subscription resolvers are implemented in resolvers.ts but won't work without:
    // 1. Installing @graphql-ws/server or graphql-ws
    // 2. Setting up a WebSocket server alongside Fastify
    // 3. Configuring the subscription transport
    // 
    // Impact: Real-time permit/inspection status updates via GraphQL subscriptions
    // will not work. Clients should use REST API polling or WebSocket connections
    // via the REST API endpoints instead.
    // 
    // To enable: See Apollo Server v3 subscription setup guide:
    // https://www.apollographql.com/docs/apollo-server/v3/data/subscriptions/
    // subscriptions: {
    //   path: '/graphql',
    //   onConnect: (connectionParams: any) => {
    //     return {
    //       apiKey: connectionParams['x-api-key'],
    //     };
    //   },
    // },
  });
}
