/**
 * SDK Generator
 * Auto-generates SDKs for TypeScript/JavaScript, Python, and React hooks
 */

import fs from 'fs';
import path from 'path';

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    location: 'path' | 'query' | 'body';
  }>;
  responseType: string;
}

export class SDKGenerator {
  private baseUrl: string;
  private endpoints: ApiEndpoint[];

  constructor(baseUrl: string, endpoints: ApiEndpoint[]) {
    this.baseUrl = baseUrl;
    this.endpoints = endpoints;
  }

  /**
   * Generate TypeScript/JavaScript SDK
   */
  generateTypeScriptSDK(): string {
    const imports = `import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';`;

    const classDefinition = `
export class KealeeAPIClient {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(baseURL: string = '${this.baseUrl}', apiKey?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
    this.apiKey = apiKey;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client.defaults.headers['X-API-Key'] = apiKey;
  }
`;

    const methods = this.endpoints
      .map(endpoint => this.generateTypeScriptMethod(endpoint))
      .join('\n\n');

    const types = this.generateTypeScriptTypes();

    return `${imports}\n\n${types}\n\n${classDefinition}\n${methods}\n}`;
  }

  /**
   * Generate Python SDK
   */
  generatePythonSDK(): string {
    const imports = `import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass`;

    const classDefinition = `
@dataclass
class KealeeAPIClient:
    base_url: str = '${this.baseUrl}'
    api_key: Optional[str] = None

    def __post_init__(self):
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({'X-API-Key': self.api_key})

    def set_api_key(self, api_key: str):
        self.api_key = api_key
        self.session.headers.update({'X-API-Key': api_key})
`;

    const methods = this.endpoints
      .map(endpoint => this.generatePythonMethod(endpoint))
      .join('\n\n');

    return `${imports}\n\n${classDefinition}\n${methods}`;
  }

  /**
   * Generate React hooks
   */
  generateReactHooks(): string {
    const imports = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';`;

    const hooks = this.endpoints
      .map(endpoint => this.generateReactHook(endpoint))
      .join('\n\n');

    return `${imports}\n\n${hooks}`;
  }

  private generateTypeScriptMethod(endpoint: ApiEndpoint): string {
    const methodName = this.toCamelCase(endpoint.path.replace(/\/api\/v1\//, ''));
    const params = endpoint.parameters
      ?.filter(p => p.location === 'path')
      .map(p => `${p.name}: ${p.type}`)
      .join(', ') || '';
    const queryParams = endpoint.parameters
      ?.filter(p => p.location === 'query')
      .map(p => `${p.name}?: ${p.type}`)
      .join(', ');
    const bodyParam = endpoint.parameters?.find(p => p.location === 'body');

    let methodBody = '';
    if (endpoint.method === 'GET') {
      methodBody = `async ${methodName}(${params}${queryParams ? `, ${queryParams}` : ''}): Promise<${endpoint.responseType}> {
    const response = await this.client.get(\`${endpoint.path.replace(/:(\w+)/g, '${$1}')}\`, {
      params: { ${queryParams ? endpoint.parameters?.filter(p => p.location === 'query').map(p => p.name).join(', ') : ''} },
    });
    return response.data;
  }`;
    } else if (endpoint.method === 'POST') {
      methodBody = `async ${methodName}(${params}${bodyParam ? `, ${bodyParam.name}: ${bodyParam.type}` : ''}): Promise<${endpoint.responseType}> {
    const response = await this.client.post(\`${endpoint.path.replace(/:(\w+)/g, '${$1}')}\`, ${bodyParam ? bodyParam.name : '{}'});
    return response.data;
  }`;
    }

    return methodBody;
  }

  private generatePythonMethod(endpoint: ApiEndpoint): string {
    const methodName = this.toSnakeCase(endpoint.path.replace(/\/api\/v1\//, ''));
    const params = endpoint.parameters
      ?.filter(p => p.location === 'path')
      .map(p => `${p.name}: ${p.type}`)
      .join(', ') || '';
    const queryParams = endpoint.parameters?.filter(p => p.location === 'query');
    const bodyParam = endpoint.parameters?.find(p => p.location === 'body');

    let methodBody = '';
    if (endpoint.method === 'GET') {
      methodBody = `    def ${methodName}(self${params ? `, ${params}` : ''}${queryParams ? `, **kwargs` : ''}):
        """${endpoint.description}"""
        url = f"${endpoint.path.replace(/:(\w+)/g, '{' + '$1' + '}')}"
        response = self.session.get(url, params=kwargs)
        response.raise_for_status()
        return response.json()`;
    } else if (endpoint.method === 'POST') {
      methodBody = `    def ${methodName}(self${params ? `, ${params}` : ''}${bodyParam ? `, ${bodyParam.name}: ${bodyParam.type}` : ''}):
        """${endpoint.description}"""
        url = f"${endpoint.path.replace(/:(\w+)/g, '{' + '$1' + '}')}"
        response = self.session.post(url, json=${bodyParam ? bodyParam.name : '{}'})
        response.raise_for_status()
        return response.json()`;
    }

    return methodBody;
  }

  private generateReactHook(endpoint: ApiEndpoint): string {
    const hookName = `use${this.toPascalCase(endpoint.path.replace(/\/api\/v1\//, ''))}`;
    const methodName = this.toCamelCase(endpoint.path.replace(/\/api\/v1\//, ''));

    if (endpoint.method === 'GET') {
      return `export function ${hookName}(params?: any) {
  return useQuery({
    queryKey: ['${methodName}', params],
    queryFn: async () => {
      const response = await axios.get('${this.baseUrl}${endpoint.path}', { params });
      return response.data;
    },
  });
}`;
    } else if (endpoint.method === 'POST') {
      return `export function ${hookName}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('${this.baseUrl}${endpoint.path}', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}`;
    }

    return '';
  }

  private generateTypeScriptTypes(): string {
    return `
export interface Permit {
  id: string;
  permitNumber: string;
  jurisdictionId: string;
  propertyId: string;
  type: string;
  status: string;
  description: string;
  valuation: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  permitId: string;
  type: string;
  status: string;
  result?: string;
  scheduledDate?: string;
  completedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
`;
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[\/-]/g, ' ')
      .replace(/\s+(\w)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/[\/-]/g, '_')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * Save SDK to file
   */
  async saveSDK(type: 'typescript' | 'python' | 'react', outputPath: string): Promise<void> {
    let content = '';
    let filename = '';

    switch (type) {
      case 'typescript':
        content = this.generateTypeScriptSDK();
        filename = 'kealee-api-client.ts';
        break;
      case 'python':
        content = this.generatePythonSDK();
        filename = 'kealee_api_client.py';
        break;
      case 'react':
        content = this.generateReactHooks();
        filename = 'use-kealee-api.ts';
        break;
    }

    const fullPath = path.join(outputPath, filename);
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
}
