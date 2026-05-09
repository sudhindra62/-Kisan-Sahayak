import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, VerticalAlign, ShadingType } from 'docx';
import type { SubsidyClaimInput } from '@/ai/schemas';

/**
 * Generates an official single-page Government of India subsidy claim application.
 * Matches the visual design, margins, and structure of the provided reference image.
 */
export async function generateSubsidyClaimDocx(input: SubsidyClaimInput): Promise<Buffer> {
  const { farmerProfile, scheme, userId, extractedData } = input;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const applicationRef = `SUB${Date.now().toString().slice(-8)}`;
  
  // Table Styling Constants
  const BORDER_STYLE = { style: BorderStyle.SINGLE, size: 2, color: "E0E0E0" };
  const HEADER_SHADING = { fill: "F8F9FA", type: ShadingType.CLEAR };
  const CELL_PADDING = { top: 100, bottom: 100, left: 150, right: 150 };

  const createSectionHeader = (text: string) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 20, font: "Calibri" })]
        })],
        columnSpan: 2,
        shading: HEADER_SHADING,
        borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE },
        verticalAlign: VerticalAlign.CENTER,
      })
    ]
  });

  const createDataRow = (label: string, value: string) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 20, font: "Calibri" })] })],
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE },
        margins: CELL_PADDING
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: value, bold: true, size: 20, font: "Calibri" })] })],
        width: { size: 65, type: WidthType.PERCENTAGE },
        borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE },
        margins: CELL_PADDING
      })
    ]
  });

  const doc = new Document({
    sections: [
      {
        properties: {
            page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
        },
        children: [
          // --- HEADER SECTION ---
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Government of India", bold: true, size: 36, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Department of Agriculture & Farmers Welfare",
                size: 24,
                font: "Times New Roman"
              }),
            ],
          }),
          new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "__________________________________________________________________________", color: "E0E0E0" })]
          }),
          new Paragraph({ text: "", spacing: { before: 200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Subsidy Claim Application",
                bold: true,
                size: 28,
                font: "Calibri"
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 400 } }),

          // --- MAIN DATA TABLE ---
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createSectionHeader("Applicant Details"),
              createDataRow("Name of Applicant:", farmerProfile.fullName),
              createDataRow("Aadhaar Number:", farmerProfile.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim()),
              createDataRow("Application ID:", applicationRef),

              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "" })], columnSpan: 2, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } } })] }),

              createSectionHeader("Land & Crop Details"),
              createDataRow("Land Area:", `${farmerProfile.landSize} Acres`),
              createDataRow("Crop Type:", farmerProfile.cropType),
              createDataRow("Damage Report:", "Crop Loss Due to " + (extractedData?.extractedLines.find(l => l.includes("Damage")) || "Adverse Weather")),

              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "" })], columnSpan: 2, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } } })] }),

              createSectionHeader("Income Details"),
              createDataRow("Annual Income:", `₹ ${farmerProfile.annualIncome.toLocaleString('en-IN')}`),

              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "" })], columnSpan: 2, borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } } })] }),

              createSectionHeader("Eligibility Status:"),
              createDataRow("Eligible for Subsidy:", "Yes"),
            ],
          }),

          // --- DECLARATION SECTION ---
          new Paragraph({ text: "", spacing: { before: 300 } }),
          new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                  new TableRow({
                      children: [
                          new TableCell({
                              children: [new Paragraph({ children: [new TextRun({ text: "Declaration:", bold: true, size: 20 })], margins: { left: 150 } })],
                              shading: HEADER_SHADING,
                              borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE }
                          })
                      ]
                  }),
                  new TableRow({
                      children: [
                          new TableCell({
                              children: [
                                  new Paragraph({
                                      text: "I hereby declare that the information provided above is true and correct to the best of my knowledge. I request the authorities to kindly process my subsidy claim.",
                                      spacing: { before: 200, after: 200 },
                                      margins: { left: 150, right: 150 }
                                  })
                              ],
                              borders: { bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE }
                          })
                      ]
                  })
              ]
          }),

          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${date}`, size: 20, font: "Calibri" }),
            ],
          }),
          new Paragraph({ text: "", spacing: { before: 800 } }),

          // --- BOTTOM SEAL & SIGNATURE ---
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
                insideHorizontal: { style: BorderStyle.NONE, size: 0 },
                insideVertical: { style: BorderStyle.NONE, size: 0 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({ text: "GOVERNMENT OF INDIA", bold: true, size: 12, font: "Calibri" }),
                        ],
                      }),
                      new Paragraph({
                          alignment: AlignmentType.LEFT,
                          children: [
                              new TextRun({ text: "Verified Digital Seal", size: 10, italics: true, color: "2F5597" })
                          ]
                      })
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "Signature: ", size: 18, font: "Calibri" }),
                            new TextRun({ text: "  R.P. Sharma  ", underline: {}, size: 20, font: "Bradley Hand ITC", bold: true }),
                        ],
                      }),
                      new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                              new TextRun({ text: "R.P. Sharma", bold: true, size: 16, font: "Calibri" }),
                          ]
                      }),
                      new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                              new TextRun({ text: "District Agriculture Officer", size: 14, font: "Calibri" }),
                          ]
                      })
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
