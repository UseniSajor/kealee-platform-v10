/**
 * SDK CLI Tool
 * Command-line tool for generating SDKs
 */

import {Command} from 'commander';
import {SDKGenerator, ApiEndpoint} from './generator';

const program = new Command();

program
  .name('kealee-sdk-generator')
  .description('Generate SDKs for Kealee API')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate SDK')
  .option('-t, --type <type>', 'SDK type (typescript, python, react)', 'typescript')
  .option('-o, --output <path>', 'Output directory', './sdk')
  .option('-u, --url <url>', 'API base URL', process.env.API_BASE_URL || 'http://localhost:3000')
  .action(async (options) => {
    // In production, would fetch endpoints from OpenAPI spec
    const endpoints = [
      {
        method: 'GET',
        path: '/api/v1/permits',
        description: 'List permits',
        parameters: [
          {name: 'jurisdictionId', type: 'string', required: false, location: 'query'},
          {name: 'status', type: 'string', required: false, location: 'query'},
        ],
        responseType: 'ApiResponse<Permit[]>',
      },
      {
        method: 'GET',
        path: '/api/v1/permits/:id',
        description: 'Get permit',
        parameters: [{name: 'id', type: 'string', required: true, location: 'path'}],
        responseType: 'ApiResponse<Permit>',
      },
      {
        method: 'POST',
        path: '/api/v1/permits',
        description: 'Create permit',
        parameters: [
          {name: 'body', type: 'CreatePermitInput', required: true, location: 'body'},
        ],
        responseType: 'ApiResponse<Permit>',
      },
    ];

    const generator = new SDKGenerator(options.url, endpoints as ApiEndpoint[]);
    await generator.saveSDK(options.type as 'typescript' | 'python' | 'react', options.output);

    console.log(`✅ Generated ${options.type} SDK at ${options.output}`);
  });

program.parse(process.argv);
