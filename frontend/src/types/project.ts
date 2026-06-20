// src/types/project.ts
export type ProjectStatus = 'pending' | 'active' | 'completed' | 'suspended';

export interface Project {
  id: string;
  title: string;
  client: string;
  code: string; // کد انحصاری پروژه (مثلاً VT-104)
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  manager: string;
  status: ProjectStatus;
  progress: number; // درصد پیشرفت پروژه
}
