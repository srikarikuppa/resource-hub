import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YEARS, BRANCHES, SUBJECTS } from '@/lib/mock-data';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

const selectClass =
  'w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

    setIsUploading(true);
    const toastId = toast.loading('Uploading resource...');

    try {
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
          description: `Uploaded by ${user.email}`,
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
      setTitle(''); setYear(''); setBranch(''); setSubject(''); setFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload resource', { id: toastId });
    } finally {
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
              <select value={subject} onChange={e => setSubject(e.target.value)} className={selectClass} disabled={!subjects.length}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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

          <Button type="submit" className="w-full" disabled={!canSubmit || isUploading}>
            <UploadIcon className={`${isUploading ? 'animate-pulse' : ''} h-4 w-4 mr-2`} /> 
            {isUploading ? 'Uploading...' : 'Upload Resource'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
