export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'presentation' | 'notes' | 'assignment' | 'lab-manual' | 'question-paper';
  year: string;
  branch: string;
  subject: string;
  uploadedBy: string;
  uploadDate: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  description: string;
  fileSize: string;
}

export interface Review {
  id: string;
  resourceId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Channel {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  memberCount: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE'];
export const SUBJECTS: Record<string, string[]> = {
  CSE: ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'Machine Learning'],
  IT: ['Web Technologies', 'Cloud Computing', 'Cyber Security', 'Software Engineering'],
  ECE: ['Digital Electronics', 'Signal Processing', 'VLSI Design', 'Communication Systems'],
  EEE: ['Power Systems', 'Control Systems', 'Electrical Machines'],
  ME: ['Thermodynamics', 'Fluid Mechanics', 'Manufacturing Processes'],
  CE: ['Structural Analysis', 'Surveying', 'Concrete Technology'],
};
export const RESOURCE_TYPES = ['pdf', 'presentation', 'notes', 'assignment', 'lab-manual', 'question-paper'];

export const mockResources: Resource[] = [
  {
    id: '1', title: 'Data Structures — Complete Lecture Notes', type: 'notes',
    year: '2nd Year', branch: 'CSE', subject: 'Data Structures',
    uploadedBy: 'Prof. Ananya Sharma', uploadDate: '2026-03-15',
    downloads: 342, rating: 4.7, reviewCount: 28, description: 'Comprehensive notes covering arrays, linked lists, trees, graphs, and hash tables with examples.',
    fileSize: '4.2 MB',
  },
  {
    id: '2', title: 'Sorting Algorithms — Visual Guide', type: 'presentation',
    year: '2nd Year', branch: 'CSE', subject: 'Algorithms',
    uploadedBy: 'Rahul Mehta', uploadDate: '2026-03-10',
    downloads: 189, rating: 4.3, reviewCount: 15, description: 'Animated presentation covering Bubble, Merge, Quick, and Heap sort with time complexity analysis.',
    fileSize: '8.7 MB',
  },
  {
    id: '3', title: 'OS Mid-Semester Question Paper 2025', type: 'question-paper',
    year: '3rd Year', branch: 'CSE', subject: 'Operating Systems',
    uploadedBy: 'Priya Gupta', uploadDate: '2026-02-28',
    downloads: 567, rating: 4.9, reviewCount: 42, description: 'Mid-semester exam paper with solutions for process scheduling, memory management, and deadlocks.',
    fileSize: '1.8 MB',
  },
  {
    id: '4', title: 'DBMS Lab Manual — SQL Exercises', type: 'lab-manual',
    year: '2nd Year', branch: 'CSE', subject: 'DBMS',
    uploadedBy: 'Prof. Vikram Reddy', uploadDate: '2026-03-05',
    downloads: 234, rating: 4.5, reviewCount: 19, description: 'Complete lab manual with 15 SQL exercises covering DDL, DML, joins, and subqueries.',
    fileSize: '3.1 MB',
  },
  {
    id: '5', title: 'Computer Networks Assignment 3', type: 'assignment',
    year: '3rd Year', branch: 'CSE', subject: 'Computer Networks',
    uploadedBy: 'Sneha Patel', uploadDate: '2026-03-18',
    downloads: 112, rating: 4.1, reviewCount: 8, description: 'Assignment on TCP/IP protocol stack, subnetting, and routing algorithms.',
    fileSize: '0.9 MB',
  },
  {
    id: '6', title: 'Machine Learning — Neural Networks PDF', type: 'pdf',
    year: '4th Year', branch: 'CSE', subject: 'Machine Learning',
    uploadedBy: 'Prof. Ananya Sharma', uploadDate: '2026-03-20',
    downloads: 289, rating: 4.8, reviewCount: 31, description: 'Detailed reference on perceptrons, backpropagation, CNNs, and RNNs with Python code snippets.',
    fileSize: '6.4 MB',
  },
  {
    id: '7', title: 'Web Technologies — React Fundamentals', type: 'notes',
    year: '3rd Year', branch: 'IT', subject: 'Web Technologies',
    uploadedBy: 'Arjun Nair', uploadDate: '2026-03-12',
    downloads: 198, rating: 4.6, reviewCount: 22, description: 'Notes on React components, hooks, state management, and routing.',
    fileSize: '2.8 MB',
  },
  {
    id: '8', title: 'Digital Electronics — Gate-Level Design', type: 'notes',
    year: '2nd Year', branch: 'ECE', subject: 'Digital Electronics',
    uploadedBy: 'Prof. Meera Joshi', uploadDate: '2026-03-08',
    downloads: 156, rating: 4.4, reviewCount: 13, description: 'Boolean algebra, K-maps, combinational and sequential circuits.',
    fileSize: '3.5 MB',
  },
];

export const mockReviews: Review[] = [
  { id: 'r1', resourceId: '1', userName: 'Kiran V.', rating: 5, comment: 'Incredibly thorough notes. Saved my semester!', date: '2026-03-18' },
  { id: 'r2', resourceId: '1', userName: 'Deepa S.', rating: 4, comment: 'Good coverage, but graph section could be more detailed.', date: '2026-03-16' },
  { id: 'r3', resourceId: '1', userName: 'Arun K.', rating: 5, comment: 'Clear explanations with great diagrams.', date: '2026-03-15' },
  { id: 'r4', resourceId: '3', userName: 'Manish R.', rating: 5, comment: 'The solutions were perfect. Thank you!', date: '2026-03-02' },
  { id: 'r5', resourceId: '6', userName: 'Nisha T.', rating: 5, comment: 'Best ML resource I have found on this platform.', date: '2026-03-21' },
];

export const mockChannels: Channel[] = [
  { id: 'ch1', name: 'Data Structures Q&A', teacher: 'Prof. Ananya Sharma', subject: 'Data Structures', memberCount: 87, lastMessage: 'Can someone explain AVL tree rotations?', lastMessageTime: '2 min ago', unreadCount: 3 },
  { id: 'ch2', name: 'Algorithms Discussion', teacher: 'Prof. Vikram Reddy', subject: 'Algorithms', memberCount: 64, lastMessage: 'Dynamic programming assignment due Friday', lastMessageTime: '15 min ago', unreadCount: 0 },
  { id: 'ch3', name: 'OS Doubts & Help', teacher: 'Prof. Meera Joshi', subject: 'Operating Systems', memberCount: 52, lastMessage: 'Page replacement algorithms comparison?', lastMessageTime: '1 hr ago', unreadCount: 1 },
  { id: 'ch4', name: 'DBMS Lab Help', teacher: 'Prof. Vikram Reddy', subject: 'DBMS', memberCount: 71, lastMessage: 'Normalization examples for 3NF', lastMessageTime: '3 hrs ago', unreadCount: 0 },
  { id: 'ch5', name: 'Machine Learning Forum', teacher: 'Prof. Ananya Sharma', subject: 'Machine Learning', memberCount: 43, lastMessage: 'CNN architecture for image classification project', lastMessageTime: '5 hrs ago', unreadCount: 5 },
];
