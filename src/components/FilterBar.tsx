import { YEARS, BRANCHES, RESOURCE_TYPES } from '@/lib/mock-data';

interface FilterBarProps {
  year: string;
  branch: string;
  subject: string;
  type: string;
  onYearChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onSubjectChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  dynamicSubjects?: string[];
}

const selectClass =
  'h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all cursor-pointer';

const FilterBar = ({
  year, branch, subject, type,
  onYearChange, onBranchChange, onSubjectChange, onTypeChange,
  dynamicSubjects = []
}: FilterBarProps) => {

  return (
    <div className="flex flex-wrap gap-3">
      <select value={year} onChange={e => onYearChange(e.target.value)} className={selectClass}>
        <option value="all">All Years</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={branch} onChange={e => { onBranchChange(e.target.value); onSubjectChange('all'); }} className={selectClass}>
        <option value="all">All Branches</option>
        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      <select value={subject} onChange={e => onSubjectChange(e.target.value)} className={selectClass} disabled={!dynamicSubjects.length}>
        <option value="all">All Subjects</option>
        {dynamicSubjects.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={type} onChange={e => onTypeChange(e.target.value)} className={selectClass}>
        <option value="all">All Types</option>
        {RESOURCE_TYPES.map(t => (
          <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
        ))}
      </select>
    </div>
  );
};

export default FilterBar;

