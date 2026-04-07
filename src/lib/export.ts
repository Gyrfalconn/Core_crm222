import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], columns: string[], fileName: string, title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  const tableRows = data.map(item => columns.map(col => item[col]));
  
  doc.autoTable({
    head: [columns.map(col => col.charAt(0).toUpperCase() + col.slice(1))],
    body: tableRows,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 185, 129] } // Emerald-600
  });
  
  doc.save(`${fileName}.pdf`);
};
