import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YEARS, BRANCHES, SUBJECTS } from '@/lib/mock-data';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing! If you just added it, please restart your Vite dev server.");
  }

  toast.loading(`AI Gatekeeper is deeply scanning your file for relevance to "${subject}"...`, { id: 'ai-scan' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptText = `You are a strict content moderator for a college resource-sharing platform. 
The user is attempting to upload a document for the academic subject: "${subject}". 
The provided title is: "${title}". 

You MUST carefully analyze the ACTUAL physical content inside the uploaded file.
Does the internal content of the file actually contain rigorous academic material (e.g. handwritten notes, typed lecture notes, syllabus, past exams, study guides) that is heavily relevant to the subject "${subject}"?
If the file is an event poster, a promotional flyer, an advertisement, a meme, random photography, or completely irrelevant to "${subject}", YOU MUST REJECT IT regardless of what the title says.

If the internal content is valid academic material relevant to the subject, reply EXACTLY with the word 'APPROVED'.
If the content is irrelevant, a poster, a flyer, or not related to the subject, reply EXACTLY with 'REJECTED:' followed by a specific reason citing exactly what you saw in the content.`;

    let contentParts: any[] = [promptText];

    // If it's a binary office file, Gemini hates inlineData for it, so we extract the raw text ourselves first!
    if (isOfficeFile) {
      const extractedText = await extractOfficeText(file);
      if (!extractedText) throw new Error("Could not extract text from this document for AI scanning. The file might be corrupted or empty.");
      
      contentParts.push({ text: `\n\n[START OF EXTRACTED DOCUMENT TEXT]\n${extractedText}\n[END OF EXTRACTED DOCUMENT TEXT]\n` });
    } else {
      // It's a standard PDF or Image, let Gemini natively scan it via inlineData
      const mimeType = file.type === '' && file.name.endsWith('.txt') ? 'text/plain' : file.type;
      const base64Data = await fileToBase64(file);
      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const result = await model.generateContent(contentParts);

    toast.dismiss('ai-scan');
    
    const textResp = result.response.text().trim();

    if (!textResp.toUpperCase().includes('APPROVED')) {
      const reason = textResp.replace(/REJECTED:/i, '').trim();
      throw new Error(`AI Rejected: ${reason || textResp}`);
    }
    
    return true;

  } catch (err: any) {
    toast.dismiss('ai-scan');
    if (err.message && err.message.includes('AI Rejected')) {
      throw err; // Pass through our deliberate AI rejection
    }
    console.error("Gemini SDK Error:", err);
    throw new Error(`Gemini API Error: ${err.message || 'Unknown verification error'}`);
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
