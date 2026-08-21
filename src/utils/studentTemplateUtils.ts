import * as XLSX from 'xlsx';

/**
 * Generates and downloads the official Student Bulk Upload Excel template (.xlsx)
 * with the "Team Name" column removed.
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
    "Academic Year",
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
    "CSE",
    "Year 1",
    "2024-2025",
    "Semester 1",
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
  studentsSheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const instructionLines = [
    ["Instructions for Student Bulk Upload"],
    ["1. Do not change the column headers."],
    ["2. Enter one student per row."],
    ["3. Do not leave required fields (Student Name, Register Number, Email, Department, Year) empty."],
    ["4. Use the correct department/year/section values."],
    ["5. Remove or overwrite the sample row before uploading."],
    ["6. Save the file as .xlsx or .xls."],
    ["7. Upload the completed file in the Excel Bulk Upload dialog."]
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionLines);
  instructionsSheet['!cols'] = [{ wch: 80 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Students");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  XLSX.writeFile(workbook, "SPDMS_Student_Bulk_Upload_Template.xlsx");
}
