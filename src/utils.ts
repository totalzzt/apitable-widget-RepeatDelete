import { FieldType, IField, IRecord } from '@apitable/widget-sdk';

export function groupDuplicateRecords(records: IRecord[], fieldId: string) {
  const groups = new Map<string, IRecord[]>();

  records.forEach(record => {
    // getCellValueString returns a string representation which is good for grouping
    const valString = record.getCellValueString(fieldId) || '';
    if (!groups.has(valString)) {
      groups.set(valString, []);
    }
    groups.get(valString)!.push(record);
  });

  // Filter out groups with only 1 record
  const duplicates = new Map<string, IRecord[]>();
  for (const [key, group] of groups.entries()) {
    if (group.length > 1) {
      duplicates.set(key, group);
    }
  }

  return duplicates;
}

export function previewMergeGroup(
  baseRecord: IRecord,
  duplicateRecords: IRecord[],
  fields: IField[]
) {
  const mergedValues: { [fieldId: string]: any } = {};
  const allRecords = [baseRecord, ...duplicateRecords];

  for (const field of fields) {
    const fId = field.id;
    const fType = field.type;

    if (
      fType === FieldType.SingleSelect ||
      fType === FieldType.SingleText ||
      fType === FieldType.Text ||
      fType === FieldType.DateTime ||
      fType === FieldType.Number ||
      fType === FieldType.Currency
    ) {
      let bestValue = null;
      for (let i = allRecords.length - 1; i >= 0; i--) {
        const val = allRecords[i].getCellValue(fId);
        if (val != null && val !== '') {
          bestValue = val;
          break;
        }
      }
      if (bestValue !== null && bestValue !== baseRecord.getCellValue(fId)) {
        mergedValues[fId] = bestValue;
      }
    } else if (
      fType === FieldType.MultiSelect ||
      fType === FieldType.Member ||
      fType === FieldType.Link ||
      fType === FieldType.Attachment
    ) {
      let combinedArray: any[] = [];
      for (const rec of allRecords) {
        const val = rec.getCellValue(fId);
        if (Array.isArray(val)) {
          combinedArray = combinedArray.concat(val);
        } else if (val != null) {
          combinedArray.push(val);
        }
      }
      
      const uniqueVals: any[] = [];
      const seen = new Set();
      for (const item of combinedArray) {
        // usually objects have id, strings are primitive
        const identifier = typeof item === 'object' && item !== null ? (item.id || item.name || JSON.stringify(item)) : item;
        if (!seen.has(identifier)) {
          seen.add(identifier);
          uniqueVals.push(item);
        }
      }

      // Check if there's actually a difference in array elements
      const baseVal = baseRecord.getCellValue(fId) || [];
      const baseLen = Array.isArray(baseVal) ? baseVal.length : (baseVal ? 1 : 0);

      // Always update if length differs or if it's the simplest way to assure merge.
      if (uniqueVals.length > baseLen) {
        mergedValues[fId] = uniqueVals;
      }
    } else {
      let bestValue = null;
      for (let i = allRecords.length - 1; i >= 0; i--) {
        const val = allRecords[i].getCellValue(fId);
        if (val != null && val !== '') {
          bestValue = val;
          break;
        }
      }
      if (bestValue !== null && bestValue !== baseRecord.getCellValue(fId)) {
        mergedValues[fId] = bestValue;
      }
    }
  }

  return mergedValues;
}

export async function mergeRecordGroup(
  baseRecord: IRecord,
  duplicateRecords: IRecord[],
  fields: IField[],
  datasheet: any
) {
  const mergedValues = previewMergeGroup(baseRecord, duplicateRecords, fields);

  if (Object.keys(mergedValues).length > 0) {
    if (datasheet.setRecord) {
      await datasheet.setRecord(baseRecord.id, mergedValues);
    } else if (datasheet.updateRecord) {
      await datasheet.updateRecord(baseRecord.id, mergedValues);
    }
  }

  const idsToDelete = duplicateRecords.map(r => r.id);
  if (idsToDelete.length > 0) {
    if (datasheet.deleteRecords) {
      await datasheet.deleteRecords(idsToDelete);
    } else if (datasheet.deleteRecord) {
      for (const id of idsToDelete) {
        await datasheet.deleteRecord(id);
      }
    }
  }
}
