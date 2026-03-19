import React, { useState } from 'react';
import { initializeWidget, useActiveViewId, useFields, useRecords, useActiveDatasheet } from '@apitable/widget-sdk';
import { Button, Select, Checkbox, Typography } from '@apitable/components';
import { groupDuplicateRecords, mergeRecordGroup } from './utils';

export const RepeatDeleteWidget: React.FC = () => {
  const viewId = useActiveViewId();
  const fields = useFields(viewId);
  const records = useRecords(viewId);
  const datasheet = useActiveDatasheet();

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
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6">Repeat Delete Settings</Typography>
        
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dGroupsArray.map(([key, groupRecords]) => {
              const isSelected = selectedGroups.has(key);
              return (
                <div key={key} style={{ border: '1px solid #f0f0f0', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ paddingTop: '2px' }}>
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
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Value: "{key || '<Empty>'}" ({groupRecords.length} records)
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', maxHeight: '100px', overflowY: 'auto' }}>
                        {groupRecords.map((r: any) => (
                          <div key={r.id} style={{ marginBottom: '4px' }}>
                            {r.title || r.id}
                          </div>
                        ))}
                      </div>
                    </div>
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
