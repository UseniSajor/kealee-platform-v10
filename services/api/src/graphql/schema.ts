/**
 * GraphQL Schema
 * Federated schema for permits and inspections
 */

import {gql} from 'apollo-server-fastify';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Permit {
    id: ID!
    permitNumber: String!
    jurisdictionId: String!
    propertyId: String!
    type: PermitType!
    status: PermitStatus!
    description: String!
    valuation: Float!
    expedited: Boolean!
    expeditedFee: Float
    feeAmount: Float
    feePaid: Boolean!
    submittedAt: DateTime
    reviewStartedAt: DateTime
    approvedAt: DateTime
    issuedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    documents: [PermitDocument!]!
    reviews: [PermitReview!]!
    inspections: [Inspection!]!
  }

  type PermitDocument {
    id: ID!
    permitId: ID!
    type: DocumentType!
    name: String!
    fileUrl: String!
    uploadedAt: DateTime!
  }

  type PermitReview {
    id: ID!
    permitId: ID!
    discipline: String!
    status: ReviewStatus!
    reviewerId: String
    startedAt: DateTime
    completedAt: DateTime
  }

  type Inspection {
    id: ID!
    permitId: ID!
    type: InspectionType!
    status: InspectionStatus!
    result: InspectionResult
    scheduledDate: DateTime
    completedAt: DateTime
    notes: String
  }

  enum PermitType {
    BUILDING
    ELECTRICAL
    PLUMBING
    MECHANICAL
    DEMOLITION
    SIGN
    GRADING
    FENCE
  }

  enum PermitStatus {
    DRAFT
    SUBMITTED
    UNDER_REVIEW
    CORRECTIONS_REQUIRED
    RESUBMITTED
    APPROVED
    ISSUED
    ACTIVE
    INSPECTION_HOLD
    EXPIRED
    COMPLETED
    CANCELLED
  }

  enum DocumentType {
    SITE_PLAN
    FLOOR_PLAN
    ELEVATION
    STRUCTURAL_CALCS
    ENERGY_CALCS
    SURVEY
    PROOF_OF_OWNERSHIP
    HOA_APPROVAL
    ENGINEERING_STAMP
    ARCHITECTURAL_STAMP
    OTHER
  }

  enum ReviewStatus {
    PENDING
    ASSIGNED
    IN_PROGRESS
    COMPLETED
    APPROVED
    REJECTED
  }

  enum InspectionType {
    FOOTING
    FOUNDATION
    FRAMING
    ELECTRICAL_ROUGH
    PLUMBING_ROUGH
    MECHANICAL_ROUGH
    INSULATION
    DRYwall
    FINAL
    OCCUPANCY
  }

  enum InspectionStatus {
    REQUESTED
    SCHEDULED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum InspectionResult {
    PASS
    FAIL
    PARTIAL
  }

  type Query {
    permit(id: ID!): Permit
    permits(
      jurisdictionId: String
      status: PermitStatus
      type: PermitType
      limit: Int
      offset: Int
    ): [Permit!]!
    inspection(id: ID!): Inspection
    inspections(permitId: ID, limit: Int, offset: Int): [Inspection!]!
  }

  type Mutation {
    createPermit(input: CreatePermitInput!): Permit!
    updatePermit(id: ID!, input: UpdatePermitInput!): Permit!
    createInspection(input: CreateInspectionInput!): Inspection!
    updateInspection(id: ID!, input: UpdateInspectionInput!): Inspection!
  }

  type Subscription {
    permitStatusChanged(permitId: ID!): Permit!
    inspectionStatusChanged(inspectionId: ID!): Inspection!
  }

  input CreatePermitInput {
    jurisdictionId: String!
    propertyId: String!
    type: PermitType!
    description: String!
    valuation: Float!
    expedited: Boolean
  }

  input UpdatePermitInput {
    status: PermitStatus
    description: String
    valuation: Float
  }

  input CreateInspectionInput {
    permitId: ID!
    type: InspectionType!
    description: String
  }

  input UpdateInspectionInput {
    status: InspectionStatus
    result: InspectionResult
    notes: String
  }
`;
