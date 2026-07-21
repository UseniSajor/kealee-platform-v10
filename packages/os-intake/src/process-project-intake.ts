import { Prisma } from '@prisma/client'
import { prisma } from '@kealee/database'
import { getActiveV30PricingFormula } from '@kealee/database'
import {
  adjustPackageFeaturesForScope,
  analyzeV30IntakeWithLlm,
  calculateV30PackagePrice,
  mergeV30PackageFeatures,
  type V30IntakeAnalysis,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'

export interface ProcessV30ProjectIntakeInput {
  projectId: string
  userId: string
  answers: V30IntakeFormAnswers
  selectedFeatures?: string[]
}

export interface ProcessV30ProjectIntakeResult {
  projectId: string
  packageId: string
  analysis: V30IntakeAnalysis
  package: {
    features: string[]
    basePrice: number
    featureAddons: number
    totalPrice: number
  }
}

/**
 * Analyze intake, persist V30IntakeResponse + V30CustomPackage (os-intake service).
 */
export async function processV30ProjectIntake(
  input: ProcessV30ProjectIntakeInput,
): Promise<ProcessV30ProjectIntakeResult> {
  const { projectId, userId, answers } = input
  const { config: formula } = await getActiveV30PricingFormula()
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { category: true },
  })
  const projectPath = project?.category ?? undefined
  const analysis = await analyzeV30IntakeWithLlm(answers, formula, projectPath)
  const features = adjustPackageFeaturesForScope(
    mergeV30PackageFeatures(
      input.selectedFeatures?.length ? input.selectedFeatures : analysis.suggestedFeatures,
      { answers, projectPath },
    ),
    answers,
    projectPath,
  )
  const { featureAddons, totalPrice } = calculateV30PackagePrice(
    analysis.estimatedCost,
    features,
    formula,
    { answers, projectPath },
  )

  const intake = await prisma.v30IntakeResponse.upsert({
    where: { projectId },
    create: {
      projectId,
      userId,
      propertyType: answers.propertyType,
      primaryScope: answers.primaryScope,
      budgetRange: answers.budgetRange,
      timeline: answers.timeline,
      location: answers.location,
      squareFeet: answers.squareFeet,
      yearBuilt: answers.yearBuilt,
      utilities: answers.utilities ?? {},
      codeConsiderations: answers.codeConsiderations,
      scopeComplexity: analysis.scopeComplexity,
      riskLevel: analysis.riskLevel,
      estimatedCost: analysis.estimatedCost,
      estimatedDays: analysis.estimatedDays,
      analysisJson: analysis.analysisJson as Prisma.InputJsonValue,
      status: 'ANALYZED',
      analyzedAt: new Date(),
    },
    update: {
      propertyType: answers.propertyType,
      primaryScope: answers.primaryScope,
      budgetRange: answers.budgetRange,
      timeline: answers.timeline,
      location: answers.location,
      squareFeet: answers.squareFeet,
      yearBuilt: answers.yearBuilt,
      utilities: answers.utilities ?? {},
      codeConsiderations: answers.codeConsiderations,
      scopeComplexity: analysis.scopeComplexity,
      riskLevel: analysis.riskLevel,
      estimatedCost: analysis.estimatedCost,
      estimatedDays: analysis.estimatedDays,
      analysisJson: analysis.analysisJson as Prisma.InputJsonValue,
      status: 'ANALYZED',
      analyzedAt: new Date(),
    },
  })

  const pkg = await prisma.v30CustomPackage.upsert({
    where: { projectId },
    create: {
      intakeResponseId: intake.id,
      projectId,
      userId,
      features,
      basePrice: analysis.estimatedCost,
      featureAddons,
      totalPrice,
      status: 'QUOTED',
    },
    update: {
      features,
      basePrice: analysis.estimatedCost,
      featureAddons,
      totalPrice,
      status: 'QUOTED',
    },
  })

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'INTAKE',
      name: `${answers.propertyType} ${answers.primaryScope}`,
      address: answers.location,
    },
  })

  return {
    projectId,
    packageId: pkg.id,
    analysis,
    package: { features, basePrice: analysis.estimatedCost, featureAddons, totalPrice },
  }
}
