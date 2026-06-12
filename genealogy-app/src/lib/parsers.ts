import { readGedcom } from 'read-gedcom';
import Papa from 'papaparse';

export interface GedcomIndividual {
  id: string;
  name: string;
  givenName: string;
  surname: string;
  birthYear?: number;
  birthPlace?: string;
}

export interface GedcomFamily {
  id: string;
  husband?: string;
  wife?: string;
  children: string[];
}

export interface GedcomData {
  individuals: Map<string, GedcomIndividual>;
  families: Map<string, GedcomFamily>;
}

export interface DNAMatch {
  name: string;
  cM: number;
  treeLink?: string;
}

export async function parseGedcom(fileContent: string): Promise<GedcomData> {
  const individuals = new Map<string, GedcomIndividual>();
  const families = new Map<string, GedcomFamily>();

  if (!fileContent || fileContent.trim() === '') {
    return { individuals, families };
  }

  // Use TextEncoder to avoid Node.js Buffer dependency in client-side code
  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(fileContent).buffer;
  const gedcom = readGedcom(arrayBuffer);

  gedcom.getIndividualRecord().arraySelect().forEach(record => {
    const id = record.pointer()[0] || '';
    const nameRecord = record.getName();

    // Attempt to extract given name and surname
    let nameStr = 'Unknown';
    let givenName = '';
    let surname = '';

    if (nameRecord.length > 0) {
        const partsOpt = nameRecord.valueAsParts()[0];
        if (partsOpt) {
            nameStr = partsOpt.join(' ').replace(/\//g, '').trim();
            if (partsOpt.length > 0) givenName = (partsOpt[0] || '').trim();
            if (partsOpt.length > 1) surname = (partsOpt[1] || '').replace(/\//g, '').trim();
        } else {
            const val = nameRecord.value()[0];
            if (val) {
                nameStr = val.replace(/\//g, '').trim();
            }
        }
    }

    // Attempt to extract birth year
    let birthYear: number | undefined;
    let birthPlace: string | undefined;
    const birthEvent = record.getEventBirth();
    if (birthEvent.length > 0) {
       const date = birthEvent.getDate();
       if (date.length > 0) {
           const dateStr = date.value()[0];
           if (dateStr) {
               const match = dateStr.match(/\d{4}/);
               if (match) birthYear = parseInt(match[0], 10);
           }
       }
       const place = birthEvent.getPlace();
       if (place.length > 0) {
           const placeStr = place.value()[0];
           if (placeStr) birthPlace = placeStr;
       }
    }

    individuals.set(id, {
      id,
      name: nameStr,
      givenName,
      surname,
      birthYear,
      birthPlace
    });
  });

  gedcom.getFamilyRecord().arraySelect().forEach(record => {
    const id = record.pointer()[0] || '';
    const husband = record.getHusband().value()[0] || undefined;
    const wife = record.getWife().value()[0] || undefined;
    const children = record.getChild().valueNonNull();

    families.set(id, {
      id,
      husband,
      wife,
      children
    });
  });

  return { individuals, families };
}

export async function parseCSV(file: File): Promise<DNAMatch[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const matches: DNAMatch[] = [];

        for (const row of results.data as Record<string, string | number>[]) {
          // Attempt to flexibly match common column names
          const name = row['Name'] || row['Match Name'] || row['Match'] || row['name'];
          const cMStr = row['Shared DNA'] || row['cM'] || row['Centimorgans'] || row['Shared cM'];
          const treeLink = row['Tree'] || row['Link'] || row['Tree Link'];

          if (name && cMStr) {
            const cM = parseFloat(cMStr.toString().replace(/,/g, '.'));
            if (!isNaN(cM)) {
              matches.push({
                name: String(name),
                cM,
                treeLink: treeLink ? String(treeLink) : undefined
              });
            }
          }
        }
        resolve(matches);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}
