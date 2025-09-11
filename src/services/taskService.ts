import { collection, doc, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type TaskType = 'event_participation' | 'committee_role' | 'council_meeting' | 'course_completion' | 'other';

export interface ChapterTask {
  id: string;
  title: string;
  type: TaskType;
  description?: string;
  criteria?: Record<string, any>; // 指定活动ID、最少参加次数等
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberTaskCompletion {
  id: string;
  memberId: string;
  taskId: string;
  title: string;
  type: TaskType;
  completed: boolean;
  completedAt?: string;
  metadata?: Record<string, any>;
  verifiedBy?: string;
  verifiedAt?: string;
}

const TASKS_COLLECTION = 'chapter_tasks';
const MEMBER_TASKS_COLLECTION = 'member_task_completions';

export const createTask = async (task: Omit<ChapterTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), { ...task, createdAt: now, updatedAt: now });
  return docRef.id;
};

export const listActiveTasks = async (): Promise<ChapterTask[]> => {
  const q = query(collection(db, TASKS_COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChapterTask[];
};

export const setMemberTaskCompletion = async (memberId: string, payload: Omit<MemberTaskCompletion, 'id'>): Promise<void> => {
  const now = new Date().toISOString();
  await addDoc(collection(db, MEMBER_TASKS_COLLECTION), { ...payload, memberId, completedAt: payload.completedAt || now });
};

export const getMemberTaskCompletions = async (memberId: string): Promise<MemberTaskCompletion[]> => {
  const q = query(collection(db, MEMBER_TASKS_COLLECTION), where('memberId', '==', memberId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as MemberTaskCompletion[];
};

export const verifyMemberTask = async (completionId: string, reviewerId: string): Promise<void> => {
  const ref = doc(collection(db, MEMBER_TASKS_COLLECTION), completionId);
  await updateDoc(ref, { verifiedBy: reviewerId, verifiedAt: new Date().toISOString() });
};


