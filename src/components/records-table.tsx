'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n-context';

interface Record {
  _id: string;
  type: 'intervention' | 'reclamation';
  createdAt: string;
  userName?: string;
  // Intervention fields
  startDate?: string;
  endDate?: string;
  entrepriseName?: string;
  responsable?: string;
  teamMembers?: string[];
  siteName?: string;
  photoUrl?: string;
  recipientEmails?: string[];
  // Reclamation fields
  date?: string;
  stationName?: string;
  reclamationType?: string;
  description?: string;
}

interface RecordsTableProps {
  records: Record[];
  onExport?: () => void;
}

export default function RecordsTable({ records, }: RecordsTableProps) {
  const { t } = useTranslation();
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecordIcon = (type: string) => {
    return type === 'intervention' ? (
      <FileText className="w-5 h-5 text-blue-600" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-red-600" />
    );
  };

  const getReclamationTypeColor = (type: string) => {
    switch (type) {
      case 'hydraulic': return 'bg-blue-100 text-blue-800';
      case 'electric': return 'bg-yellow-100 text-yellow-800';
      case 'mechanic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Records_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export completed successfully!');
      } else {
        toast.error('Failed to export records');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred during export');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('records.all-records')}</h2>
          <p className="text-gray-600">{t('records.manage-desc')}</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {t('records.export-excel')}
        </Button>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('records.records-overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('records.no-records-found')}</h3>
              <p className="text-gray-600">{t('records.create-first')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('table.type')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">{t('table.company-station')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">{t('table.responsible-person')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">{t('table.date-range')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[120px]">{t('table.site-type')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">{t('table.team-members')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">{t('table.description')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[100px]">{t('table.photo')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[200px]">{t('table.recipients')}</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">{t('table.created-at')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRecordIcon(record.type)}
                          <Badge variant={record.type === 'intervention' ? 'default' : 'destructive'}>
                            {record.type}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">
                          {record.type === 'intervention' ? record.entrepriseName : record.stationName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {record.responsable || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {record.type === 'intervention' ? (
                            <div>
                              <div>{record.startDate ? formatDate(record.startDate) : 'N/A'}</div>
                              <div className="text-gray-600">to {record.endDate ? formatDate(record.endDate) : 'N/A'}</div>
                            </div>
                          ) : (
                            <div>{record.date ? formatDate(record.date) : 'N/A'}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {record.type === 'intervention' ? (
                            record.siteName || 'N/A'
                          ) : (
                            <Badge className={`text-xs ${getReclamationTypeColor(record.reclamationType!)}`}>
                              {record.reclamationType || 'N/A'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {record.teamMembers ? record.teamMembers.join(', ') : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm max-w-xs truncate">
                          {record.description || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {record.photoUrl ? (
                            <a href={record.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Photo
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm max-w-xs truncate">
                          {record.recipientEmails ? record.recipientEmails.join(', ') : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {formatDate(record.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getRecordIcon(selectedRecord.type)}
                  <h3 className="text-xl font-bold capitalize">{selectedRecord.type === 'intervention' ? t('records.intervention-details') : t('records.reclamation-details')}</h3>
                </div>
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                {selectedRecord.type === 'intervention' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-gray-700">{t('records.company-name')}</label>
                        <p className="text-gray-900">{selectedRecord.entrepriseName}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.responsible-person')}</label>
                        <p className="text-gray-900">{selectedRecord.responsable}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.site-name')}</label>
                        <p className="text-gray-900">{selectedRecord.siteName}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.start-date')}</label>
                        <p className="text-gray-900">{formatDate(selectedRecord.startDate!)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.end-date')}</label>
                        <p className="text-gray-900">{formatDate(selectedRecord.endDate!)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.team-members')}</label>
                        <p className="text-gray-900">{selectedRecord.teamMembers?.join(', ')}</p>
                      </div>
                    </div>
                    {selectedRecord.photoUrl && (
                      <div>
                        <label className="font-medium text-gray-700">{t('records.photo')}</label>
                        <Image
                          src={selectedRecord.photoUrl}
                          alt={t('records.intervention-photo')}
                          width={400}
                          height={300}
                          className="mt-2 max-w-full h-48 object-cover rounded"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-gray-700">{t('records.station-name')}</label>
                        <p className="text-gray-900">{selectedRecord.stationName}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.reclamation-type')}</label>
                        <Badge className={getReclamationTypeColor(selectedRecord.reclamationType!)}>
                          {selectedRecord.reclamationType}
                        </Badge>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">{t('records.date')}</label>
                        <p className="text-gray-900">{formatDate(selectedRecord.date!)}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="font-medium text-gray-700">{t('records.description')}</label>
                        <p className="text-gray-900">{selectedRecord.description}</p>
                      </div>
                    </div>
                    {selectedRecord.photoUrl && (
                      <div>
                        <label className="font-medium text-gray-700">{t('records.photo')}</label>
                        <Image
                          src={selectedRecord.photoUrl}
                          alt={t('records.reclamation-photo')}
                          width={400}
                          height={300}
                          className="mt-2 max-w-full h-48 object-cover rounded"
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="font-medium text-gray-700">{t('records.recipient-emails')}</label>
                  <p className="text-gray-900">{selectedRecord.recipientEmails?.join(', ')}</p>
                </div>

                <div>
                  <label className="font-medium text-gray-700">{t('records.created-at')}</label>
                  <p className="text-gray-900">{formatDate(selectedRecord.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
