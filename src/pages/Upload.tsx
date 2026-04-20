import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YEARS, BRANCHES, SUBJECTS } from '@/lib/mock-data';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
// AI scanning logic moved to secure backend to protect credentials
import JSZip from 'jszip';

const selectClass =
  'w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

const extractOfficeText = async (file: File): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(file);
    let fullText = '';
    
    if (file.name.toLowerCase().endsWith('.docx')) {
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (docXml) fullText = docXml.replace(/<[^>]+>/g, ' ');
    } else if (file.name.toLowerCase().endsWith('.pptx')) {
      let slideIndex = 1;
      while (true) {
        const slideXml = await zip.file(`ppt/slides/slide${slideIndex}.xml`)?.async("string");
        if (!slideXml) break;
        fullText += slideXml.replace(/<[^>]+>/g, ' ') + "\n";
        slideIndex++;
      }
    }
    return fullText.trim();
  } catch (e) {
    console.warn("Failed to extract office text via JSZip", e);
    return "";
  }
};

const scanDocument = async (file: File, title: string, subject: string): Promise<boolean> => {
  const isOfficeFile = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.pptx');
  const allowedNativeTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

  if (!isOfficeFile && !allowedNativeTypes.includes(file.type)) {
    throw new Error(`File type (${file.type || 'unknown'}) is not supported by our AI scanner. Please upload PDF, DOCX, PPTX, plain text, or standard images.`);
  }

  toast.loading(`AI Gatekeeper is deeply scanning your file for relevance to "${subject}"...`, { id: 'ai-scan' });

  try {
    let contentParts: any[] = [];

    if (isOfficeFile) {
      const extractedText = await extractOfficeText(file);
      if (!extractedText) throw new Error("Could not extract text from this document for AI scanning.");
      contentParts.push({ text: `\n\n[FILE: ${file.name}]\n[TITLE: ${title}]\n[EXTRACTED TEXT]:\n${extractedText}\n` });
    } else {
      const mimeType = file.type === '' && file.name.endsWith('.txt') ? 'text/plain' : file.type;
      const base64Data = await fileToBase64(file);
      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await fetch("http://localhost:3001/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts: contentParts, subject })
    });

    toast.dismiss('ai-scan');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Backend verification failed");
    }

    const data = await response.json();
    
    if (data.isAcademic && data.isSafe) {
      if (data.source === 'LOCAL') {
        toast.success("Local Validation Passed: Academic content detected. 🔍");
      } else {
        toast.success("AI Validation Passed: Rigorous academic content detected. ✨");
      }
      return true;
    } else {
      throw new Error(`Rejected: ${data.summary || "This document does not meet our academic standards."}`);
    }

  } catch (err: any) {
    toast.dismiss('ai-scan');
    throw err;
  }
};

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useAuth();

  const subjects = branch ? SUBJECTS[branch] || [] : [];
  const canSubmit = title.trim() && year && branch && subject && file;

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) {
      if (!user) toast.error('You must be logged in to upload resources');
      return;
    }
    
    if (file && file.size > maxFileSize) {
      toast.error('File size limit exceeded. Please upload a file under 5MB.');
      return;
    }

    let toastId;

    try {
      // 0. AI File Scanning
      if (file) {
        setIsScanning(true);
        await scanDocument(file, title, subject);
        setIsScanning(false);
      }
      
      setIsUploading(true);
      toastId = toast.loading('Uploading resource...');

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${user.uid}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // 3. Detect type from extension
      const typeMap: Record<string, string> = {
          pdf: 'pdf',
          pptx: 'presentation',
          ppt: 'presentation',
          docx: 'notes',
          doc: 'notes',
          txt: 'notes'
      };
      const resourceType = typeMap[fileExt?.toLowerCase() || ''] || 'notes';

      // 4. Insert into resources table
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title,
          description: description.trim() ? `${description.trim()}\n\nUploaded by ${user.email}` : `Uploaded by ${user.email}`,
          type: resourceType,
          year,
          branch,
          subject,
          file_url: publicUrl,
          file_size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploaded_by: user.uid
        });

      if (dbError) throw dbError;

      toast.success('Resource uploaded successfully!', { id: toastId });
      setTitle(''); setDescription(''); setYear(''); setBranch(''); setSubject(''); setFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload resource', { id: toastId });
    } finally {
      setIsScanning(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1" style={{ lineHeight: '1.15' }}>
          Upload Resource
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Share academic materials with your peers</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Data Structures Complete Notes"
              className={selectClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly describe the contents of this resource..."
              className={`${selectClass} h-20 py-2.5 resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Year</label>
              <select value={year} onChange={e => setYear(e.target.value)} className={selectClass}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Branch</label>
              <select value={branch} onChange={e => { setBranch(e.target.value); setSubject(''); }} className={selectClass}>
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
              <input 
                list="subjects-list"
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                placeholder="Select or type a subject"
                className={selectClass}
                disabled={!branch}
                autoComplete="off"
              />
              <datalist id="subjects-list">
                {subjects.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">File</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/50">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : 'Click to select a file (Max 5MB)'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit || isUploading || isScanning}>
            <UploadIcon className={`${(isUploading || isScanning) ? 'animate-pulse' : ''} h-4 w-4 mr-2`} /> 
            {isScanning ? 'AI Validating File...' : isUploading ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
