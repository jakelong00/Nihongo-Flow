
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, FileDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toCSV } from '../utils/csvHelper';

export const ExcelToCSVTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setError(null);
    }
  };

  const convertFile = async () => {
    if (!file) return;

    setStatus('processing');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      // raw: false ensures that values are formatted as strings where appropriate
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error("The Excel file seems to be empty or invalid.");
      }

      // Use our internal toCSV utility which handles the complex escaping
      const csvContent = toCSV(jsonData as object[]);
      
      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name.replace(/\.[^/.]+$/, "") + ".csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || "Failed to convert file.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#4A4E69]/5 space-y-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="anime-title text-[9px] font-black text-[#78A2CC] uppercase tracking-widest flex items-center gap-2">
          <FileUp size={14} /> Excel to CSV Converter
        </h3>
      </div>
      
      <p className="text-xs font-bold text-[#4A4E69]/50 leading-relaxed">
        Struggling with CSV formatting? Upload your Excel (.xlsx) file here. 
        We'll convert it into a perfectly escaped CSV compatible with Nihongo Flow.
      </p>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
          ${file ? 'border-[#B4E4C3] bg-[#B4E4C3]/5' : 'border-[#4A4E69]/10 hover:border-[#78A2CC]/40 hover:bg-[#78A2CC]/5'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
        />
        
        {file ? (
          <div className="text-center space-y-2">
            <div className="p-3 bg-[#B4E4C3]/20 text-[#B4E4C3] rounded-full inline-block">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-[10px] font-black anime-title text-[#4A4E69] uppercase">{file.name}</p>
            <p className="text-[8px] font-bold text-[#4A4E69]/40 uppercase">Ready for conversion</p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="p-3 bg-[#4A4E69]/5 text-[#4A4E69]/40 rounded-full inline-block">
              <FileUp size={24} />
            </div>
            <p className="text-[10px] font-black anime-title text-[#4A4E69]/40 uppercase">Click to upload Excel</p>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-500">
          <AlertCircle size={16} />
          <p className="text-[10px] font-bold uppercase">{error}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600">
          <CheckCircle2 size={16} />
          <p className="text-[10px] font-bold uppercase">Conversion Successful! Check your downloads.</p>
        </div>
      )}

      <button 
        disabled={!file || status === 'processing'}
        onClick={convertFile}
        className={`
          w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-black anime-title uppercase tracking-widest text-[9px] transition-all
          ${!file || status === 'processing' 
            ? 'bg-[#4A4E69]/5 text-[#4A4E69]/20 cursor-not-allowed' 
            : 'bg-[#78A2CC] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}
        `}
      >
        {status === 'processing' ? 'Processing...' : (
          <>
            <FileDown size={16} /> Convert & Download CSV
          </>
        )}
      </button>
    </div>
  );
};
