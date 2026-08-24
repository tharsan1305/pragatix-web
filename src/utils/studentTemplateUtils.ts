import * as XLSX from 'xlsx';

/**
 * Generates and downloads the official Student Bulk Upload Excel template (.xlsx)
 * matching the 16 columns expected by the backend StudentImportService.
 */
export function downloadStudentTemplate() {
  const headers = [
    "Student Name",
    "Register Number",
    "SPR Number",
    "Email",
    "Phone",
    "Address",
    "Date of Birth",
    "Department",
    "Year",
    "Semester",
    "Gender",
    "Section",
    "Guardian Name",
    "Relationship",
    "Guardian Phone",
    "Guardian Email"
  ];

  const sampleRow = [
    "Arun Kumar",
    "24CSC101",
    "SPR001",
    "arun@example.com",
    "9876543210",
    "123 Main St, City",
    "2000-01-15",
    "Computer Science and Engineering",
    "I",
    "I",
    "Male",
    "A",
    "Ravi Kumar",
    "Father",
    "9988776655",
    "ravi@example.com"
  ];

  const studentsData = [headers, sampleRow];
  const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData);

  // Set column widths
  studentsSheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));

  const instructionLines = [
    ["Instructions for Student Bulk Upload"],
    ["1. Do not rename or change the 16 column headers in row 1."],
    ["2. Enter one student per row."],
    ["3. Required fields: Student Name, Register Number, Email, Department, Year, Section."],
    ["4. Year should be Roman numeral: I, II, III, or IV."],
    ["5. Date of Birth format: YYYY-MM-DD (e.g. 2000-01-15)."],
    ["6. Guardian Phone must be a valid 10-digit number."],
    ["7. Remove or overwrite the sample row before uploading."],
    ["8. Save the file as .xlsx or .xls and upload."]
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionLines);
  instructionsSheet['!cols'] = [{ wch: 80 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Students");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  XLSX.writeFile(workbook, "SPDMS_Student_Bulk_Upload_Template.xlsx");
}
