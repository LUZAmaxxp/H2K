import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, ImageRun, BorderStyle, ShadingType } from 'docx';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export interface BaseReportData {
  _id?: string;
  employeeName: string;
  employeeId: string;
  siteName: string;
  stationName: string;
  description: string;
  priority: string;
  status: string;
  photoUrl?: string;
  recipientEmails: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InterventionData extends BaseReportData {
  interventionType: string;
  interventionTeam?: string;
  interventionNumber?: string;
}

export interface ReclamationData extends BaseReportData {
  reclamationType: string;
  date?: Date;
  interventionNumber?: string;
}

// Professional color scheme
const COLORS = {
  PRIMARY: '2C5FAA',
  SECONDARY: '374151',
  ACCENT: '1E40AF',
  LIGHT_BLUE: 'F0F7FF',
  LIGHT_GRAY: 'F8F9FA',
  BORDER: 'D1D5DB',
  WHITE: 'FFFFFF',
  DARK_BLUE: '1E3A8A'
};

// Helper function to create elegant frame with label
function createElegantFrame(title: string, content: Paragraph[]): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.BORDER },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.BORDER },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.BORDER },
    },
    margins: {
      top: 150,
      bottom: 150,
      left: 150,
      right: 150,
    },
    rows: [
      // Title row with elegant background
      new TableRow({
        children: [
          new TableCell({
            shading: {
              fill: COLORS.PRIMARY,
              type: ShadingType.CLEAR,
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 18,
                    color: COLORS.WHITE,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 120 },
              }),
            ],
          }),
        ],
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: {
              fill: COLORS.LIGHT_BLUE,
              type: ShadingType.CLEAR,
            },
            children: [
              ...content,
            ],
            margins: {
              top: 200,
              bottom: 200,
              left: 200,
              right: 200,
            },
          }),
        ],
      }),
    ],
  });
}

// Helper function to create info item with better spacing
function createInfoItem(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: 16,
        color: COLORS.DARK_BLUE,
        font: 'Arial',
      }),
      new TextRun({
        text: value,
        size: 16,
        color: COLORS.SECONDARY,
        font: 'Arial',
      }),
    ],
    spacing: { after: 120 },
  });
}

// Common function to create report frames
function createReportFrames(data: BaseReportData & { 
  type: string; 
  typeValue: string;
  interventionTeam?: string;
  interventionNumber?: string;
}) {
  const frames: Table[] = [];

  // Frame 1: Information Générale
  const infoGeneraleContent: Paragraph[] = [
    createInfoItem("Nombre d'intervention", data.interventionNumber || "N/A"),
    createInfoItem("Station", data.stationName),
    createInfoItem("Site", data.siteName),
    createInfoItem("Type", data.typeValue),
  ];

  frames.push(createElegantFrame("INFORMATION GÉNÉRALE", infoGeneraleContent));

  // Frame 2: Date et Heure
  const now = new Date();
  const dateTimeContent: Paragraph[] = [
    createInfoItem("Date", now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })),
    createInfoItem("Heure", now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })),
    createInfoItem("Soumis par", data.employeeName),
    createInfoItem("Matricule", data.employeeId),
  ];

  frames.push(createElegantFrame("DATE ET HEURE", dateTimeContent));

  // Frame 3: Description
  const descriptionContent: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: data.description || "Aucune description fournie",
          size: 16,
          color: COLORS.SECONDARY,
          font: 'Arial',
        }),
      ],
      spacing: { after: 150 },
      alignment: AlignmentType.JUSTIFIED,
    }),
  ];

  frames.push(createElegantFrame("DESCRIPTION", descriptionContent));

  return frames;
}




// Helper function to get status text in French

// Helper function to create section headers
function createSectionHeader(text: string, spacingBefore = 400, spacingAfter = 200): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 20,
        color: COLORS.PRIMARY,
        font: 'Arial',
      }),
    ],
    spacing: { before: spacingBefore, after: spacingAfter },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: COLORS.PRIMARY,
        space: 1,
      },
    },
  });
}

// Helper function to create header table with logo and title
function createHeaderTable(): Table {
  const logoPath = path.join(process.cwd(), 'public', 'LOGO-SOUSS-MASSA-1033x308px-removebg-preview.png');
  
  let logoImage = null;
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoImage = new ImageRun({
      data: logoBuffer,
      transformation: {
        width: 120,
        height: 36,
      },
      type: "png",
    });
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [30, 70],
    rows: [
      new TableRow({
        children: [
          // Logo cell
          new TableCell({
            children: logoImage ? [
              new Paragraph({
                children: [logoImage],
                alignment: AlignmentType.LEFT,
              })
            ] : [new Paragraph('')],
            verticalAlign: AlignmentType.CENTER,
          }),
          // Title cell
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "RAPPORT DES TRAVAUX",
                    bold: true,
                    size: 18,
                    color: COLORS.PRIMARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "D'EXPLOITATION ET DE LA MAINTENANCE",
                    bold: true,
                    size: 16,
                    color: COLORS.PRIMARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "DES STATIONS ET KITS DE RELEVAGE",
                    bold: true,
                    size: 16,
                    color: COLORS.PRIMARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            verticalAlign: AlignmentType.CENTER,
          }),
        ],
      }),
    ],
  });
}

// Helper function to create elegant signature section
function createSignatureSection(): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [50, 50],
    margins: {
      top: 400,
      bottom: 200,
      left: 400,
      right: 400,
    },
    rows: [
      new TableRow({
        children: [
          // Left signature - Visa responsable d'intervention
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Visa responsable d'intervention",
                    bold: true,
                    size: 14,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 300, after: 150 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "_________________________",
                    size: 14,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Nom et signature",
                    size: 12,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          // Right signature - Visa chef de division
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Visa chef de division",
                    bold: true,
                    size: 14,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 300, after: 150 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "_________________________",
                    size: 14,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Nom et signature",
                    size: 12,
                    color: COLORS.SECONDARY,
                    font: 'Arial',
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Helper function to create photo section
function createPhotoSection(photoBuffer: Buffer | null): Paragraph[] {
  if (!photoBuffer) return [];

  return [
    createSectionHeader("DOCUMENTATION PHOTOGRAPHIQUE"),
    new Paragraph({
      children: [
        new ImageRun({
          data: photoBuffer,
          transformation: {
            width: 350,
            height: 250,
          },
          type: "png",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];
}

// Common function to generate report document with improved layout
async function generateReportDoc(
  data: BaseReportData & {
    type: string;
    typeValue: string;
    interventionTeam?: string;
    interventionNumber?: string;
  },
): Promise<Buffer> {
  let photoBuffer: Buffer | null = null;

  try {
    if (data.photoUrl) {
      photoBuffer = await fetch(data.photoUrl).then(res => res.buffer());
    }
  } catch (error) {
    console.warn('Échec du chargement de la photo:', error);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 600,
              right: 600,
              bottom: 600,
              left: 600,
            },
          },
        },
        children: [
          // Header with logo and title in a table
          createHeaderTable(),

          // Spacing after header
          new Paragraph({
            children: [],
            spacing: { after: 600 },
          }),

          // Rounded Frames
          ...createReportFrames(data),

          // Photo Section
          ...createPhotoSection(photoBuffer),

          // Report Recipients Section
          createSectionHeader("DESTINATAIRES DU RAPPORT"),
          new Paragraph({
            children: [
              new TextRun({
                text: data.recipientEmails.join(", "),
                size: 16,
                color: COLORS.SECONDARY,
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Signature Section
          createSignatureSection(),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "Document généré électroniquement - Région Souss-Massa",
                size: 12,
                color: COLORS.SECONDARY,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
export async function generateInterventionDoc(data: InterventionData): Promise<Buffer> {
  // Parse the description to extract team information
  const description = data.description || '';
  
  // Extract team information
  const teamMatch = description.match(/Team:\s*([^.]+)/i);
  const team = teamMatch ? teamMatch[1].trim() : (data.interventionTeam || 'Non spécifiée');

  // Extract dates
  const datesMatch = description.match(/Dates:\s*([^.]+)/i);
  const dates = datesMatch ? datesMatch[1].trim() : 'Non spécifiée';

  // Extract company
  const companyMatch = description.match(/Company:\s*([^.]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : 'Non spécifiée';

  // Create formatted description
  const descriptionWithLabels = `Intervention réalisée par l'équipe: ${team}\nPériode: ${dates}\nEntreprise: ${company}\n\nDétails: ${data.description || 'Aucun détail supplémentaire'}`;

  return generateReportDoc(
    {
      ...data,
      type: "Intervention",
      typeValue: data.interventionType,
      interventionTeam: team,
      interventionNumber: data.interventionNumber || `INT-${data._id?.toString().substring(0, 8) || '00000000'}`,
      description: descriptionWithLabels
    }
  );
}

export async function generateReclamationDoc(data: ReclamationData): Promise<Buffer> {
  // Create formatted description
  const descriptionWithLabels = `Type de réclamation: ${data.reclamationType}\nStation concernée: ${data.stationName}\nDate de l'incident: ${data.date ? new Date(data.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Non spécifiée'}\n\nDescription: ${data.description || 'Aucune description fournie'}`;

  return generateReportDoc(
    {
      ...data,
      type: "Réclamation",
      typeValue: data.reclamationType,
      interventionNumber: data.interventionNumber || `REC-${data._id?.toString().substring(0, 8) || '00000000'}`,
      description: descriptionWithLabels
    }
  );
}
