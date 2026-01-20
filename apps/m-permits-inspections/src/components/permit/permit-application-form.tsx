'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Building, FileText, MapPin, DollarSign } from 'lucide-react';
import FileUpload from '@/components/file-upload';
import { PermitApiService } from '@/lib/api/permits';

// Define form schema with Zod
const permitFormSchema = z.object({
  // Project Information
  projectId: z.string().min(1, 'Project is required'),
  permitType: z.string().min(1, 'Permit type is required'),
  permitSubtype: z.string().optional(),
  priority: z.enum(['standard', 'expedited', 'emergency']).default('standard'),
  
  // Property Information
  propertyAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required').max(2, 'State must be 2 letters'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    county: z.string().min(1, 'County is required'),
    parcelNumber: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  
  // Project Details
  projectDetails: z.object({
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    scopeOfWork: z.string().min(1, 'Scope of work is required'),
    valuation: z.number().min(0, 'Valuation must be positive'),
    squareFootage: z.number().min(0, 'Square footage must be positive'),
    numberOfStories: z.number().int().min(1, 'At least 1 story required'),
    occupancyType: z.string().min(1, 'Occupancy type is required'),
    constructionType: z.string().min(1, 'Construction type is required'),
    proposedUse: z.string().min(1, 'Proposed use is required'),
  }),
  
  // Jurisdiction
  jurisdictionId: z.string().min(1, 'Jurisdiction is required'),
  
  // Documents
  documents: z.array(z.any()).min(1, 'At least one document is required'),
});

type PermitFormData = z.infer<typeof permitFormSchema>;

interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  county: string;
  city: string;
  permitTypes: Array<{
    type: string;
    subtypes: string[];
    feeBase: number;
    requirements: string[];
  }>;
}

interface Project {
  id: string;
  name: string;
  clientName: string;
  projectType: string;
}

interface PermitApplicationFormProps {
  onSubmit?: (data: PermitFormData) => Promise<void>;
  initialData?: Partial<PermitFormData>;
  projects: Project[];
  onSuccess?: (permit: any) => void;
  onError?: (error: string) => void;
}

export default function PermitApplicationForm({
  onSubmit,
  initialData,
  projects,
  onSuccess,
  onError,
}: PermitApplicationFormProps) {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedFees, setEstimatedFees] = useState<number>(0);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);

  const form = useForm<PermitFormData>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
      priority: 'standard',
      propertyAddress: {
        state: '',
        county: '',
        city: '',
      },
      projectDetails: {
        valuation: 0,
        squareFootage: 0,
        numberOfStories: 1,
      },
      documents: [],
      ...initialData,
    },
  });

  // Watch form values for real-time validation
  const watchPermitType = form.watch('permitType');
  const watchJurisdictionId = form.watch('jurisdictionId');
  const watchValuation = form.watch('projectDetails.valuation');
  const watchSquareFootage = form.watch('projectDetails.squareFootage');

  // Load jurisdictions
  useEffect(() => {
    const loadJurisdictions = async () => {
      try {
        const data = await PermitApiService.getJurisdictions();
        setJurisdictions(data.jurisdictions || []);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load jurisdictions';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    };
    
    loadJurisdictions();
  }, [onError]);

  // Update selected jurisdiction
  useEffect(() => {
    if (watchJurisdictionId) {
      const jurisdiction = jurisdictions.find(j => j.id === watchJurisdictionId);
      setSelectedJurisdiction(jurisdiction || null);
      
      if (jurisdiction) {
        // Update state and county based on jurisdiction
        form.setValue('propertyAddress.state', jurisdiction.state);
        form.setValue('propertyAddress.county', jurisdiction.county);
        form.setValue('propertyAddress.city', jurisdiction.city);
      }
    }
  }, [watchJurisdictionId, jurisdictions, form]);

  // Calculate estimated fees
  useEffect(() => {
    if (selectedJurisdiction && watchPermitType && watchValuation && watchSquareFootage) {
      const permitType = selectedJurisdiction.permitTypes?.find(
        pt => pt.type === watchPermitType
      );
      
      if (permitType) {
        // Simple fee calculation - in reality this would be more complex
        let fee = permitType.feeBase || 0;
        fee += watchValuation * 0.001; // 0.1% of valuation
        fee += watchSquareFootage * 0.5; // $0.50 per square foot
        
        setEstimatedFees(Math.round(fee));
      }
    }
  }, [selectedJurisdiction, watchPermitType, watchValuation, watchSquareFootage]);

  // Load required documents
  useEffect(() => {
    const loadRequiredDocuments = async () => {
      if (watchJurisdictionId && watchPermitType) {
        try {
          const data = await PermitApiService.getRequiredDocuments(
            watchJurisdictionId,
            watchPermitType
          );
          setRequiredDocuments(data.documents || []);
        } catch (err) {
          console.error('Error loading required documents:', err);
          setRequiredDocuments([]);
        }
      }
    };
    
    loadRequiredDocuments();
  }, [watchJurisdictionId, watchPermitType]);

  const handleSubmit = async (data: PermitFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // If custom onSubmit is provided, use it
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      // Otherwise, use the API service
      const permitData = {
        projectId: data.projectId,
        permitType: data.permitType,
        permitSubtype: data.permitSubtype,
        priority: data.priority,
        propertyAddress: data.propertyAddress,
        projectDetails: data.projectDetails,
        jurisdictionId: data.jurisdictionId,
        documents: uploadedDocuments,
      };

      const permit = await PermitApiService.createPermit(permitData);
      
      if (onSuccess) {
        onSuccess(permit);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit permit application';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (files: File[]) => {
    setUploadedDocuments(files);
    form.setValue('documents', files);
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    // Save draft logic - could use localStorage or API
    console.log('Saving draft:', formData);
    // TODO: Implement draft saving
  };

  const handleCalculateFees = async () => {
    const permitId = form.getValues().projectId; // This would be the permit ID if editing
    if (!permitId) {
      setError('Please complete the form first');
      return;
    }
    
    try {
      const fees = await PermitApiService.calculateFees(permitId);
      setEstimatedFees(fees.totalFees || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate fees');
    }
  };

  const occupancyTypes = [
    'Assembly', 'Business', 'Educational', 'Factory/Industrial',
    'Hazardous', 'Institutional', 'Mercantile', 'Residential',
    'Storage', 'Utility/Miscellaneous'
  ];

  const constructionTypes = [
    'Type I - Fire Resistive',
    'Type II - Non-Combustible',
    'Type III - Ordinary',
    'Type IV - Heavy Timber',
    'Type V - Wood Frame'
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="ml-2 text-red-800">{error}</span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="project" className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="project">
                <Building className="h-4 w-4 mr-2" />
                Project
              </TabsTrigger>
              <TabsTrigger value="property">
                <MapPin className="h-4 w-4 mr-2" />
                Property
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Project Information Tab */}
            <TabsContent value="project" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>
                    Select the project and permit type for this application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map(project => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name} - {project.clientName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the project this permit is for
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jurisdictionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jurisdiction *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select jurisdiction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {jurisdictions.map(jurisdiction => (
                                <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                                  {jurisdiction.name} ({jurisdiction.city}, {jurisdiction.county})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permitType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permit Type *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!selectedJurisdiction}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select permit type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedJurisdiction?.permitTypes?.map(type => (
                                <SelectItem key={type.type} value={type.type}>
                                  {type.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedJurisdiction && watchPermitType && (
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="font-semibold text-blue-800">Jurisdiction Information</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        {selectedJurisdiction.name} • {selectedJurisdiction.city}, {selectedJurisdiction.state}
                      </p>
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Estimated Fees: ${estimatedFees.toLocaleString()}</p>
                        <p className="text-gray-600">
                          Based on valuation: ${watchValuation.toLocaleString()}, 
                          Area: {watchSquareFootage.toLocaleString()} sq ft
                        </p>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">
                              Standard (10-15 business days)
                            </SelectItem>
                            <SelectItem value="expedited">
                              Expedited (5-7 business days) + 50% fee
                            </SelectItem>
                            <SelectItem value="emergency">
                              Emergency (1-2 business days) + 100% fee
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose processing speed based on your timeline
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Property Information Tab */}
            <TabsContent value="property" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>
                    Enter the property address and location details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="propertyAddress.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyAddress.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyAddress.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyAddress.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyAddress.county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County *</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="propertyAddress.parcelNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcel Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-789" {...field} />
                        </FormControl>
                        <FormDescription>
                          Also known as Assessor's Parcel Number (APN)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Provide detailed information about the construction project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectDetails.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the construction project..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of what will be built or renovated
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectDetails.scopeOfWork"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scope of Work *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed scope of work..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Include specific work to be performed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="projectDetails.valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Valuation ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="1000"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectDetails.squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectDetails.numberOfStories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Stories *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectDetails.occupancyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupancy Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select occupancy type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {occupancyTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="projectDetails.constructionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Construction Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select construction type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {constructionTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="projectDetails.proposedUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Use *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Single-family residence, Retail store, Office building" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription>
                    Upload all required documents for permit approval
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {requiredDocuments.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Required Documents</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {requiredDocuments.map((doc, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <FormField
                          control={form.control}
                          name="documents"
                          render={() => (
                            <FormItem>
                              <FormLabel>Upload Documents *</FormLabel>
                              <FormControl>
                                <FileUpload
                                  folder="permit-documents"
                                  multiple={true}
                                  acceptedTypes={[
                                    'application/pdf',
                                    'image/*',
                                    'application/msword',
                                    'application/vnd.openxmlformats-officedocument.*'
                                  ]}
                                  onUploadComplete={(uploadedFiles) => {
                                    // FileUpload returns metadata, but we need File objects for form submission
                                    // Store the uploaded file metadata for reference
                                    // The actual files will be uploaded separately during form submission
                                    // For now, we'll track them separately
                                    console.log('Files uploaded:', uploadedFiles);
                                    // Note: The form will handle file uploads during submission
                                  }}
                                />
                              </FormControl>
                              {/* Alternative: Direct file input for form submission */}
                              <Input
                                type="file"
                                multiple
                                accept="application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.*"
                                onChange={(e) => {
                                  const selectedFiles = Array.from(e.target.files || []);
                                  handleDocumentUpload(selectedFiles);
                                }}
                                className="mt-2"
                              />
                              <FormDescription>
                                Upload all required documents in PDF, Word, or image format
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {uploadedDocuments.length > 0 && (
                        <div className="rounded-lg border p-4">
                          <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                          <ul className="space-y-2">
                            {uploadedDocuments.map((file, index) => (
                              <li key={index} className="flex items-center justify-between">
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-500">
                        Select a jurisdiction and permit type to see required documents
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Application Details</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Jurisdiction:</dt>
                      <dd>{selectedJurisdiction?.name || 'Not selected'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Permit Type:</dt>
                      <dd>{watchPermitType || 'Not selected'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Priority:</dt>
                      <dd className="capitalize">{form.watch('priority')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Documents:</dt>
                      <dd>{uploadedDocuments.length} uploaded</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Fee Estimate</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Estimated Fees:</span>
                      <span>${estimatedFees.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Final fees will be confirmed after review. Additional fees may apply for:
                    </p>
                    <ul className="text-sm text-gray-500 list-disc pl-5">
                      <li>Plan review</li>
                      <li>Inspections</li>
                      <li>Additional permits</li>
                      <li>Expedited processing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                  >
                    Save as Draft
                  </Button>
                  
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCalculateFees}
                      disabled={!watchJurisdictionId || !watchPermitType}
                    >
                      Calculate Final Fees
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !form.formState.isValid}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  By submitting, you confirm that all information is accurate and complete.
                  False statements may result in permit denial or revocation.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
