/**
 * The slice of the Prisma client this package uses, as an interface, so the
 * services take any client — the real `@kealee/database` one in the apps and
 * worker, an in-memory one in the tests. Each delegate is typed loosely on
 * purpose: the registry's contract is the records it returns, not Prisma's
 * generated argument types.
 */
export interface Delegate {
  create(args: { data: any }): Promise<any>
  update(args: { where: any; data: any }): Promise<any>
  findUnique(args: { where: any; include?: any }): Promise<any>
  findFirst(args: { where: any; orderBy?: any; include?: any }): Promise<any>
  findMany(args: { where?: any; orderBy?: any; take?: number; include?: any }): Promise<any[]>
  count(args?: { where?: any }): Promise<number>
  upsert?(args: { where: any; create: any; update: any }): Promise<any>
}

export interface KnowledgeDb {
  knowledgeSource: Delegate
  knowledgeArtifact: Delegate
  knowledgeArtifactVersion: Delegate
  knowledgeArtifactFile: Delegate
  knowledgeProjectLink: Delegate
  knowledgeLineageEdge: Delegate
  generationRun: Delegate
  generationInput: Delegate
  generationOutput: Delegate
  learningEvent: Delegate
}

/** Narrow a full Prisma client to what this package needs. */
export function knowledgeDb(prisma: unknown): KnowledgeDb {
  return prisma as KnowledgeDb
}
