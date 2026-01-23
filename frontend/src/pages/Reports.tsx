import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, FileText, Play, Eye, Settings, Clock, CheckCircle, XCircle } from 'lucide-react';
import { mockReports } from '@/data/demoData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'operational' | 'financial' | 'risk' | 'compliance';
  templateId: string;
  templateName: string;
  parameters: Record<string, any>;
  filters: {
    dateRange?: { from: string; to: string };
    entities?: string[];
    currencies?: string[];
    status?: string[];
    customFilters?: Record<string, any>;
  };
  outputFormat: 'pdf' | 'csv' | 'excel' | 'json';
  isScheduled: boolean;
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
  };
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastRun?: string;
  nextRun?: string;
}

interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  parameters: Record<string, any>;
  executedBy: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'operational' | 'financial' | 'risk' | 'compliance';
  category: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'date' | 'select' | 'multiselect';
    label: string;
    required: boolean;
    options?: string[];
    defaultValue?: any;
  }[];
  supportedFormats: ('pdf' | 'csv' | 'excel' | 'json')[];
  isActive: boolean;
}

export default function Reports() {
  const [reportConfigs, setReportConfigs] = useState<ReportConfiguration[]>([]);
  const [reportExecutions, setReportExecutions] = useState<ReportExecution[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Dialog states
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [executeReportOpen, setExecuteReportOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportForm, setReportForm] = useState<Partial<ReportConfiguration>>({});
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to: Date | undefined}>({ from: undefined, to: undefined });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = () => {
    setLoading(true);
    
    // Transform mock reports to match expected format
    const transformedReports = mockReports.map(report => ({
      id: report.id,
      name: report.name,
      description: report.description,
      type: report.type,
      templateId: report.templateId,
      templateName: report.templateName,
      parameters: {},
      filters: {
        dateRange: { from: '2026-01-01', to: '2026-01-31' }
      },
      outputFormat: report.outputFormat,
      isScheduled: report.isScheduled,
      scheduleConfig: report.scheduleConfig,
      isActive: report.isActive,
      createdAt: report.createdAt,
      createdBy: report.createdBy,
      lastRun: report.lastRun,
      nextRun: report.nextRun
    }));
    
    setReportConfigs(transformedReports);
    
    // Mock report executions
    const mockExecutions = [
      {
        id: 'EXE-001',
        reportId: 'RPT-001',
        reportName: 'Monthly Transaction Summary',
        status: 'completed' as const,
        startedAt: '2026-01-01T09:00:00Z',
        completedAt: '2026-01-01T09:05:00Z',
        duration: 300,
        fileSize: 2048000,
        downloadUrl: '/reports/monthly-summary-jan2026.pdf',
        parameters: { month: '2026-01', format: 'pdf' },
        executedBy: 'system@whizunik.com'
      },
      {
        id: 'EXE-002',
        reportId: 'RPT-002',
        reportName: 'Risk Assessment Report',
        status: 'running' as const,
        startedAt: '2026-01-05T08:00:00Z',
        parameters: { week: '2026-W01', format: 'excel' },
        executedBy: 'risk.manager@whizunik.com'
      },
      {
        id: 'EXE-003',
        reportId: 'RPT-001',
        reportName: 'Monthly Transaction Summary',
        status: 'failed' as const,
        startedAt: '2025-12-31T23:55:00Z',
        completedAt: '2025-12-31T23:58:00Z',
        duration: 180,
        errorMessage: 'Insufficient data for December 2025',
        parameters: { month: '2025-12', format: 'pdf' },
        executedBy: 'system@whizunik.com'
      }
    ];
    
    setReportExecutions(mockExecutions);
    
    // Set mock templates
    const mockTemplatesData = [
      {
        id: 'TPL-001',
        name: 'Transaction Summary Template',
        description: 'Monthly summary of all transactions with volume and performance metrics',
        type: 'operational' as const,
        category: 'Monthly Reports',
        parameters: [
          { name: 'month', type: 'date' as const, label: 'Report Month', required: true },
          { name: 'currency', type: 'select' as const, label: 'Base Currency', required: false, options: ['USD', 'EUR', 'GBP'], defaultValue: 'USD' }
        ],
        supportedFormats: ['pdf', 'excel'] as ('pdf' | 'excel')[],
        isActive: true
      },
      {
        id: 'TPL-002',
        name: 'Risk Analysis Template',
        description: 'Comprehensive risk assessment across all active positions',
        type: 'risk' as const,
        category: 'Risk Management',
        parameters: [
          { name: 'riskThreshold', type: 'number' as const, label: 'Risk Threshold', required: false, defaultValue: 70 },
          { name: 'includeHistorical', type: 'select' as const, label: 'Include Historical Data', required: false, options: ['Yes', 'No'], defaultValue: 'Yes' }
        ],
        supportedFormats: ['pdf', 'excel', 'csv'] as ('pdf' | 'excel' | 'csv')[],
        isActive: true
      },
      {
        id: 'TPL-003',
        name: 'Compliance Audit Template',
        description: 'Regulatory compliance status and audit trail report',
        type: 'compliance' as const,
        category: 'Compliance',
        parameters: [
          { name: 'auditPeriod', type: 'date' as const, label: 'Audit Period', required: true },
          { name: 'regulations', type: 'multiselect' as const, label: 'Regulations', required: false, options: ['Basel III', 'AML', 'GDPR'] }
        ],
        supportedFormats: ['pdf'] as ('pdf')[],
        isActive: true
      }
    ];
    
    setReportTemplates(mockTemplatesData);
    
    setTimeout(() => setLoading(false), 500);
  };

  const handleCreateReport = () => {
    const newReport = {
      id: `RPT-${Date.now()}`,
      ...reportForm,
      filters: {
        ...reportForm.filters,
        dateRange: dateRange.from && dateRange.to ? {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd')
        } : undefined
      },
      createdAt: new Date().toISOString(),
      createdBy: 'current.user@whizunik.com',
      isActive: true
    } as ReportConfiguration;
    
    setReportConfigs(prev => [...prev, newReport]);
    setCreateReportOpen(false);
    resetForm();
  };

  const handleExecuteReport = async (reportId: string, parameters?: Record<string, any>) => {
    try {
      const response = await fetch(`/api/reports/configurations/${reportId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: parameters || {},
          executedBy: 'current-user'
        })
      });
      
      if (response.ok) {
        fetchReportsData();
        setExecuteReportOpen(false);
      }
    } catch (error) {
      console.error('Error executing report:', error);
    }
  };

  const handleScheduleToggle = async (reportId: string, isScheduled: boolean) => {
    try {
      const response = await fetch(`/api/reports/configurations/${reportId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isScheduled })
      });
      
      if (response.ok) {
        fetchReportsData();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleDownload = async (executionId: string) => {
    try {
      const response = await fetch(`/api/reports/executions/${executionId}/download`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${executionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const resetForm = () => {
    setReportForm({});
    setDateRange({ from: undefined, to: undefined });
    setSelectedTemplate(null);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      queued: { variant: 'outline' as const, label: 'Queued', icon: Clock },
      running: { variant: 'secondary' as const, label: 'Running', icon: Play },
      completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
      failed: { variant: 'destructive' as const, label: 'Failed', icon: XCircle }
    };
    
    return config[status as keyof typeof config] || config.queued;
  };

  const getTypeBadge = (type: string) => {
    const config = {
      operational: { variant: 'default' as const, label: 'Operational' },
      financial: { variant: 'secondary' as const, label: 'Financial' },
      risk: { variant: 'destructive' as const, label: 'Risk' },
      compliance: { variant: 'outline' as const, label: 'Compliance' }
    };
    
    return config[type as keyof typeof config] || config.operational;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Generate, schedule, and manage operational reports</p>
        </div>
        <Button onClick={() => setCreateReportOpen(true)} className="gap-2">
          <FileText className="w-4 h-4" />
          Create Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="configured">Configured Reports</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Report Templates</CardTitle>
              <CardDescription>Pre-built report templates for common use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant={getTypeBadge(template.type).variant}>
                          {getTypeBadge(template.type).label}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Category</div>
                          <div className="text-sm">{template.category}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Supported Formats</div>
                          <div className="flex gap-1 mt-1">
                            {template.supportedFormats.map(format => (
                              <Badge key={format} variant="outline" className="text-xs">
                                {format.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Parameters</div>
                          <div className="text-sm">{template.parameters.length} parameters</div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setReportForm({ 
                                templateId: template.id,
                                templateName: template.name,
                                type: template.type,
                                outputFormat: template.supportedFormats[0] || 'pdf'
                              });
                              setCreateReportOpen(true);
                            }}
                          >
                            Configure
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{template.name}</DialogTitle>
                                <DialogDescription>{template.description}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Type</Label>
                                    <Badge variant={getTypeBadge(template.type).variant}>
                                      {getTypeBadge(template.type).label}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <p>{template.category}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Parameters</Label>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {template.parameters.map((param, idx) => (
                                      <div key={idx} className="p-2 border rounded">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{param.label}</span>
                                          <div className="flex gap-2">
                                            <Badge variant="outline">{param.type}</Badge>
                                            {param.required && <Badge variant="destructive">Required</Badge>}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label>Supported Formats</Label>
                                  <div className="flex gap-2">
                                    {template.supportedFormats.map(format => (
                                      <Badge key={format} variant="outline">
                                        {format.toUpperCase()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Reports</CardTitle>
              <CardDescription>Your saved report configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Output Format</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportConfigs.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-xs text-muted-foreground">{report.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadge(report.type).variant}>
                          {getTypeBadge(report.type).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.templateName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.outputFormat.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.lastRun ? new Date(report.lastRun).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={report.isScheduled} 
                          onCheckedChange={(checked) => handleScheduleToggle(report.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.isActive ? 'default' : 'secondary'}>
                          {report.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleExecuteReport(report.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent report generation activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Executed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportExecutions.map((execution) => {
                    const statusConfig = getStatusBadge(execution.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow key={execution.id}>
                        <TableCell className="font-medium">{execution.reportName}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(execution.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {execution.duration ? formatDuration(execution.duration) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {execution.fileSize ? formatFileSize(execution.fileSize) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{execution.executedBy}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {execution.status === 'completed' && execution.downloadUrl && (
                              <Button
                                size="sm"
                                onClick={() => handleDownload(execution.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {execution.errorMessage && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Execution Error</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                                      <p className="text-sm text-destructive">{execution.errorMessage}</p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Reports configured for automatic execution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Last Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportConfigs.filter(r => r.isScheduled).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <Badge variant={getTypeBadge(report.type).variant} className="text-xs">
                            {getTypeBadge(report.type).label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {report.scheduleConfig?.frequency || 'Not configured'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {report.nextRun ? new Date(report.nextRun).toLocaleString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {report.scheduleConfig?.recipients?.length || 0} recipients
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Switch 
                            checked={report.isScheduled}
                            onCheckedChange={(checked) => handleScheduleToggle(report.id, checked)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Configure a new report from the selected template
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <div className="font-medium">{selectedTemplate.name}</div>
                <div className="text-sm text-muted-foreground">{selectedTemplate.description}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={reportForm.name || ''}
                    onChange={(e) => setReportForm({...reportForm, name: e.target.value})}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select
                    value={reportForm.outputFormat}
                    onValueChange={(value) => setReportForm({...reportForm, outputFormat: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTemplate.supportedFormats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={reportForm.description || ''}
                  onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      from: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      to: e.target.value ? new Date(e.target.value) : undefined
                    })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {setCreateReportOpen(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport}>
                  Create Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
