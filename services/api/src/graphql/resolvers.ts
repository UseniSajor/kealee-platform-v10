/**
 * GraphQL Resolvers
 * Resolvers for permits and inspections GraphQL API
 */

import {createClient} from '@supabase/supabase-js';
import {PubSub} from 'graphql-subscriptions';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const pubsub = new PubSub();

export const resolvers = {
  Query: {
    permit: async (_: any, {id}: {id: string}) => {
      const {data} = await supabase
        .from('Permit')
        .select('*, documents:PermitDocument(*), reviews:PermitReview(*), inspections:Inspection(*)')
        .eq('id', id)
        .single();

      return data;
    },

    permits: async (
      _: any,
      {
        jurisdictionId,
        status,
        type,
        limit = 50,
        offset = 0,
      }: {
        jurisdictionId?: string;
        status?: string;
        type?: string;
        limit?: number;
        offset?: number;
      }
    ) => {
      let query = supabase.from('Permit').select('*');

      if (jurisdictionId) {
        query = query.eq('jurisdictionId', jurisdictionId);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('type', type);
      }

      query = query.range(offset, offset + limit - 1).order('createdAt', {ascending: false});

      const {data} = await query;
      return data || [];
    },

    inspection: async (_: any, {id}: {id: string}) => {
      const {data} = await supabase
        .from('Inspection')
        .select('*, permit:Permit(*)')
        .eq('id', id)
        .single();

      return data;
    },

    inspections: async (
      _: any,
      {permitId, limit = 50, offset = 0}: {permitId?: string; limit?: number; offset?: number}
    ) => {
      let query = supabase.from('Inspection').select('*');

      if (permitId) {
        query = query.eq('permitId', permitId);
      }

      query = query.range(offset, offset + limit - 1).order('requestedAt', {ascending: false});

      const {data} = await query;
      return data || [];
    },
  },

  Mutation: {
    createPermit: async (_: any, {input}: {input: any}) => {
      const {data, error} = await supabase.from('Permit').insert(input).select().single();

      if (error) throw new Error(error.message);

      // Publish event
      pubsub.publish('PERMIT_STATUS_CHANGED', {
        permitStatusChanged: data,
      });

      return data;
    },

    updatePermit: async (_: any, {id, input}: {id: string; input: any}) => {
      const {data, error} = await supabase
        .from('Permit')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Publish event
      pubsub.publish('PERMIT_STATUS_CHANGED', {
        permitStatusChanged: data,
      });

      return data;
    },

    createInspection: async (_: any, {input}: {input: any}) => {
      const {data, error} = await supabase.from('Inspection').insert(input).select().single();

      if (error) throw new Error(error.message);

      // Publish event
      pubsub.publish('INSPECTION_STATUS_CHANGED', {
        inspectionStatusChanged: data,
      });

      return data;
    },

    updateInspection: async (_: any, {id, input}: {id: string; input: any}) => {
      const {data, error} = await supabase
        .from('Inspection')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Publish event
      pubsub.publish('INSPECTION_STATUS_CHANGED', {
        inspectionStatusChanged: data,
      });

      return data;
    },
  },

  Subscription: {
    permitStatusChanged: {
      subscribe: (_: any, {permitId}: {permitId: string}) => {
        return pubsub.asyncIterator(`PERMIT_STATUS_CHANGED_${permitId}`);
      },
    },

    inspectionStatusChanged: {
      subscribe: (_: any, {inspectionId}: {inspectionId: string}) => {
        return pubsub.asyncIterator(`INSPECTION_STATUS_CHANGED_${inspectionId}`);
      },
    },
  },
};
