import React, { useState } from 'react';
import { initializeWidget, useActiveViewId, useFields, useRecords, useDatasheet } from '@apitable/widget-sdk';
import { Button, Select, Checkbox, Typography } from '@apitable/components';
import { groupDuplicateRecords, mergeRecordGroup, previewMergeGroup } from './utils';

export const RepeatDeleteWidget: React.FC = () => {
  const viewId = useActiveViewId();
  const fields = useFields(viewId);
  const records = useRecords(viewId);
  const datasheet = useDatasheet();

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, any[]>>(new Map());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);

  // default to first column if not selected
  const activeFieldId = selectedFieldId || (fields && fields.length > 0 ? fields[0].id : null);

  const handleFindDuplicates = () => {
    if (!activeFieldId || !records) return;
    const groups = groupDuplicateRecords(records, activeFieldId);
    setDuplicateGroups(groups);
    setSelectedGroups(new Set());
  };

  const handleSelectAll = () => {
    const allKeys = new Set(duplicateGroups.keys());
    setSelectedGroups(allKeys);
  };

  const handleInvertSelection = () => {
    const newSelected = new Set<string>();
    for (const key of duplicateGroups.keys()) {
      if (!selectedGroups.has(key)) {
        newSelected.add(key);
      }
    }
    setSelectedGroups(newSelected);
  };

  const handleCancelSelection = () => {
    setSelectedGroups(new Set());
  };

  const handleMerge = async () => {
    if (selectedGroups.size === 0 || !datasheet || !fields) return;
    setIsMerging(true);
    try {
      for (const groupKey of selectedGroups) {
        const groupRecords = duplicateGroups.get(groupKey);
        if (groupRecords && groupRecords.length > 1) {
          const baseRecord = groupRecords[0];
          const duplicateRecords = groupRecords.slice(1);
          // Wait for one merge to complete before next
          await mergeRecordGroup(baseRecord, duplicateRecords, fields, datasheet);
        }
      }
      // Re-find duplicates to update UI
      setDuplicateGroups(new Map());
      setSelectedGroups(new Set());
    } catch (e) {
      console.error('Merge error:', e);
    } finally {
      setIsMerging(false);
    }
  };

  const dGroupsArray = Array.from(duplicateGroups.entries()) as any[];

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column', width: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">Repeat Delete Settings</Typography>
        
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {fields && (
            <div style={{ width: '200px' }}>
              <Select
                value={activeFieldId || undefined}
                options={fields.map(f => ({ label: f.name, value: f.id }))}
                onChange={(val) => {
                  // handle onChange depending on value structure apitable select component returns
                  const resolvedVal = typeof val === 'object' && val !== null ? (val as any).value : val;
                  setSelectedFieldId(resolvedVal as string);
                }}
              />
            </div>
          )}
          <Button color="primary" onClick={handleFindDuplicates}>Find Duplicates</Button>
        </div>

        {dGroupsArray.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button onClick={handleSelectAll}>Select All</Button>
            <Button onClick={handleInvertSelection}>Invert</Button>
            <Button onClick={handleCancelSelection}>Cancel</Button>
            <Button color="danger" onClick={handleMerge} loading={isMerging}>Merge ({selectedGroups.size})</Button>
          </div>
        )}
      </div>

      <div style={{ flexGrow: 1, overflow: 'auto', padding: '16px' }}>
        {dGroupsArray.length === 0 ? (
          <Typography color="textSecondary">No duplicates found or click "Find Duplicates".</Typography>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dGroupsArray.map(([key, groupRecords]) => {
              const isSelected = selectedGroups.has(key);
              return (
                <div key={key} style={{ border: '1px solid #f0f0f0', padding: '16px', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e: any) => {
                        const checked = e.target ? e.target.checked : e;
                        const newSet = new Set(selectedGroups);
                        if (checked) newSet.add(key);
                        else newSet.delete(key);
                        setSelectedGroups(newSet);
                      }}
                    />
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                      Duplicate Value: "{key || '<Empty>'}" ({groupRecords.length} records)
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#666', overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', wordBreak: 'break-word', tableLayout: 'auto' }}>
                      <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                          <th style={{ padding: '10px', borderRight: '1px solid #e8e8e8', whiteSpace: 'nowrap', width: '120px', color: '#333' }}>字段名称</th>
                          {groupRecords.map((r: any, idx: number) => (
                            <th key={r.id} style={{ padding: '10px', borderRight: '1px solid #e8e8e8', minWidth: '150px', color: '#333' }}>
                              原始记录 {idx + 1}
                            </th>
                          ))}
                          <th style={{ padding: '10px', color: '#1890ff', minWidth: '150px' }}>合并后预览</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          if (!fields) return null;
                          const mergedPreview = previewMergeGroup(groupRecords[0], groupRecords.slice(1), fields);

                          const fieldsToShow = fields.filter(f => {
                            const hasOriginalVal = groupRecords.some((r: any) => {
                              const v = r.getCellValueString(f.id);
                              return v != null && v !== '';
                            });
                            const mergedVal = mergedPreview[f.id];
                            const baseVal = groupRecords[0].getCellValueString(f.id);
                            const hasMergedVal = (mergedVal != null && String(mergedVal) !== '') || (baseVal != null && baseVal !== '');
                            return hasOriginalVal || hasMergedVal;
                          });

                          return fieldsToShow.map(f => {
                            let mergedDisplayVal = '';
                            if (mergedPreview.hasOwnProperty(f.id)) {
                              const val = mergedPreview[f.id];
                              mergedDisplayVal = Array.isArray(val) ? val.map((v: any) => typeof v === 'object' && v !== null ? (v.name || v.id || JSON.stringify(v)) : v).join(', ') : String(val);
                            } else {
                              mergedDisplayVal = groupRecords[0].getCellValueString(f.id) || '';
                            }

                            return (
                              <tr key={f.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.3s', ...(({ "&:hover": { background: '#fafafa' } } as any)) }}>
                                <td style={{ padding: '10px', borderRight: '1px solid #f0f0f0', fontWeight: 'bold', color: '#555' }}>
                                  {f.name}
                                </td>
                                {groupRecords.map((r: any) => {
                                  const valStr = r.getCellValueString(f.id) || '';
                                  return (
                                    <td key={r.id} style={{ padding: '10px', borderRight: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                                      {valStr || <span style={{color: '#ccc'}}>-</span>}
                                    </td>
                                  )
                                })}
                                <td style={{ padding: '10px', color: mergedPreview.hasOwnProperty(f.id) ? '#1890ff' : 'inherit', background: '#f6faff', fontWeight: mergedPreview.hasOwnProperty(f.id) ? 'bold' : 'normal', verticalAlign: 'top' }}>
                                  {mergedDisplayVal || <span style={{color: '#91caff'}}>-</span>}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

initializeWidget(RepeatDeleteWidget, process.env.WIDGET_PACKAGE_ID!);
