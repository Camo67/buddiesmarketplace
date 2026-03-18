import readXlsxFile, { readSheetNames } from "read-excel-file/node";

export const paxiTemplateSheetName = "PAXI Bulk Upload Template";
export const paxiTemplateHeaderRowNumber = 12;
export const paxiTemplateDataStartRowNumber = 13;

export const paxiTemplateHeaders = [
  "*Receiver Name and Surname",
  "*Receiver Mobile Number",
  "*Destination Store",
  "Tracking Number",
] as const;

export type ParsedPaxiShipment = {
  rowNumber: number;
  receiverName: string;
  receiverMobile: string;
  destinationStore: string;
  trackingNumber: string | null;
};

export type ParsedPaxiWorkbookResult = {
  shipments: ParsedPaxiShipment[];
  errors: string[];
};

function normalizeHeader(value: string) {
  return value
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanCell(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function isTemplateExampleRow(
  receiverMobileRaw: string,
  destinationStoreRaw: string,
) {
  return (
    receiverMobileRaw.includes("Capture a 9 or 10 digit mobile number") ||
    destinationStoreRaw.includes("Store where receiver will pick up parcel")
  );
}

export async function parsePaxiBulkWorkbook(
  buffer: Buffer,
): Promise<ParsedPaxiWorkbookResult> {
  const sheetNames = await readSheetNames(buffer);
  const sheetName = sheetNames[0];

  if (!sheetName) {
    return {
      shipments: [],
      errors: ["The workbook does not contain any sheets."],
    };
  }

  const rows = await readXlsxFile(buffer, {
    sheet: sheetNames.includes(paxiTemplateSheetName)
      ? paxiTemplateSheetName
      : sheetName,
  });

  const headerRow = rows[paxiTemplateHeaderRowNumber - 1] ?? [];
  const normalizedActualHeaders = headerRow
    .slice(0, paxiTemplateHeaders.length)
    .map((value) => normalizeHeader(cleanCell(value)));
  const normalizedExpectedHeaders = paxiTemplateHeaders.map((value) => normalizeHeader(value));

  if (
    normalizedActualHeaders.length < normalizedExpectedHeaders.length ||
    normalizedActualHeaders.some((value, index) => value !== normalizedExpectedHeaders[index])
  ) {
    return {
      shipments: [],
      errors: [
        `The template headers do not match the expected PAXI layout on row ${paxiTemplateHeaderRowNumber}.`,
      ],
    };
  }

  const shipments: ParsedPaxiShipment[] = [];
  const errors: string[] = [];

  for (let index = paxiTemplateDataStartRowNumber - 1; index < rows.length; index += 1) {
    const rowNumber = index + 1;
    const row = rows[index] ?? [];
    const receiverName = cleanCell(row[0]);
    const receiverMobileRaw = cleanCell(row[1]);
    const destinationStoreRaw = cleanCell(row[2]);
    const destinationStore = destinationStoreRaw.toUpperCase();
    const trackingNumber = cleanCell(row[3]);

    if (![receiverName, receiverMobileRaw, destinationStore, trackingNumber].some(Boolean)) {
      continue;
    }

    if (isTemplateExampleRow(receiverMobileRaw, destinationStoreRaw)) {
      continue;
    }

    const receiverMobile = normalizeMobile(receiverMobileRaw);

    if (!receiverName) {
      errors.push(`Row ${rowNumber}: receiver name is required.`);
    }

    if (!(receiverMobile.length === 9 || receiverMobile.length === 10)) {
      errors.push(`Row ${rowNumber}: receiver mobile must contain 9 or 10 digits.`);
    }

    if (!/^P\d{4,}$/i.test(destinationStore)) {
      errors.push(`Row ${rowNumber}: destination store must look like a PAXI point code, for example P4455.`);
    }

    if (!receiverName || !(receiverMobile.length === 9 || receiverMobile.length === 10) || !/^P\d{4,}$/i.test(destinationStore)) {
      continue;
    }

    shipments.push({
      rowNumber,
      receiverName,
      receiverMobile,
      destinationStore,
      trackingNumber: trackingNumber || null,
    });
  }

  if (shipments.length === 0 && errors.length === 0) {
    errors.push(
      `No parcel rows were found. Add parcel details from row ${paxiTemplateDataStartRowNumber} onward.`,
    );
  }

  return {
    shipments,
    errors,
  };
}
