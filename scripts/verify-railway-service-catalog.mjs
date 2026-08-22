import { readFile } from 'node:fs/promises'

const catalog = JSON.parse(await readFile('config/railway-services.json', 'utf8'))
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
if (!chunks.length) {
  console.error('Pipe `railway status --json` into this verifier')
  process.exit(2)
}

const status = JSON.parse(Buffer.concat(chunks).toString('utf8'))
if (status.id !== catalog.project.id) throw new Error(`Unexpected Railway project: ${status.id}`)

const failures = []
const environments = new Map(status.environments.edges.map(({ node }) => [node.name, node]))
for (const [environmentName, policy] of Object.entries({ production: catalog.production, staging: catalog.staging })) {
  const environment = environments.get(environmentName)
  if (!environment) {
    failures.push(`${environmentName}: environment missing`)
    continue
  }
  const services = new Map(environment.serviceInstances.edges.map(({ node }) => [node.serviceName, node]))
  for (const name of policy.required) {
    const deployment = services.get(name)?.latestDeployment
    if (!deployment) failures.push(`${environmentName}/${name}: required deployment missing`)
    else if (deployment.deploymentStopped) failures.push(`${environmentName}/${name}: deployment stopped`)
    else if (['FAILED', 'CRASHED'].includes(deployment.status)) failures.push(`${environmentName}/${name}: ${deployment.status}`)
  }
  for (const name of policy.retired ?? []) {
    const deployment = services.get(name)?.latestDeployment
    if (deployment && !deployment.deploymentStopped) failures.push(`${environmentName}/${name}: retired service still enabled`)
  }
}

if (failures.length) {
  console.error('Railway service-catalog drift:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Railway service catalog matches the declared delivery topology')
