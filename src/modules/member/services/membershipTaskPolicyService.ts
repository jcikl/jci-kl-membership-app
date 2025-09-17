import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

export type TaskRequirement =
  | {
      type: 'event_participation' | 'course_completion';
      anyType: boolean;
      specificTypes?: string; // comma separated string for simplicity
      minCount: number;
    }
  | {
      type: 'committee_role';
      minCount: number; // at least 1
    };

export interface MembershipTaskPolicy {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  target: {
    type: 'accountType' | 'membershipCategory';
    values: string[]; // account types or membership categories
  };
  requirements: TaskRequirement[];
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'membership_task_policies';

// Get all task policies
export const getAllMembershipTaskPolicies = async (): Promise<MembershipTaskPolicy[]> => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MembershipTaskPolicy));
};

// Get a specific task policy by ID
export const getMembershipTaskPolicy = async (id: string): Promise<MembershipTaskPolicy | null> => {
  const ref = doc(collection(db, COLLECTION), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MembershipTaskPolicy;
};

// Save or update a task policy
export const saveMembershipTaskPolicy = async (policy: Omit<MembershipTaskPolicy, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> => {
  const now = new Date().toISOString();
  
  // Filter out undefined values to avoid Firebase errors
  const cleanPolicy = Object.fromEntries(
    Object.entries(policy).filter(([_, value]) => value !== undefined)
  );
  
  const policyData = {
    ...cleanPolicy,
    updatedAt: now,
  };

  if (policy.id) {
    // Update existing policy
    const ref = doc(collection(db, COLLECTION), policy.id);
    await updateDoc(ref, policyData);
    return policy.id;
  } else {
    // Create new policy
    const ref = doc(collection(db, COLLECTION));
    await setDoc(ref, {
      ...policyData,
      createdAt: now,
    });
    return ref.id;
  }
};

// Delete a task policy
export const deleteMembershipTaskPolicy = async (id: string): Promise<void> => {
  const ref = doc(collection(db, COLLECTION), id);
  await deleteDoc(ref);
};


