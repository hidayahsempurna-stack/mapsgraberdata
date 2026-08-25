import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { BusinessLead } from '../types';
import { sanitizeLeadPayload, UserContext } from '../utils/security';

const CLOUD_LEADS_COLLECTION = 'cloud_leads';

/**
 * Subscribe to realtime cloud leads updates scoped specifically to the current authenticated user
 */
export function subscribeToUserCloudLeads(
  user: UserContext,
  onUpdate: (leads: BusinessLead[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!user || !user.email) {
    onUpdate([]);
    return () => {};
  }

  const cleanEmail = user.email.trim().toLowerCase();

  try {
    // If Root Admin, can subscribe to all or own leads.
    // By default, filter strictly by ownerEmail to maintain data silo enforcement
    const leadsCollection = collection(db, CLOUD_LEADS_COLLECTION);
    
    let q;
    if (user.isRootAdmin) {
      q = query(leadsCollection, limit(1000));
    } else {
      q = query(
        leadsCollection,
        where('ownerEmail', '==', cleanEmail),
        limit(1000)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leads: BusinessLead[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as BusinessLead;
        // Client-side safety filter
        if (user.isRootAdmin || !data.ownerEmail || data.ownerEmail.toLowerCase() === cleanEmail) {
          leads.push({ ...data, id: docSnap.id });
        }
      });
      onUpdate(leads);
    }, (error) => {
      console.warn('Realtime user cloud leads subscription error:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  } catch (err: any) {
    console.error('Failed to init user cloud leads subscription:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Backward compatibility alias for subscribeToCloudLeads
 */
export function subscribeToCloudLeads(
  onUpdate: (leads: BusinessLead[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeToUserCloudLeads({ email: 'global', isRootAdmin: true }, onUpdate, onError);
}

/**
 * Save single lead to Firestore cloud with strict user ownership metadata
 */
export async function saveLeadToCloud(lead: BusinessLead, user?: UserContext | string): Promise<void> {
  const userContext: UserContext = typeof user === 'string' 
    ? { email: user } 
    : (user || { email: 'anonymous@team.internal' });

  const leadId = lead.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, CLOUD_LEADS_COLLECTION, leadId);

  const payload = sanitizeLeadPayload({
    ...lead,
    id: leadId,
    checkedAt: lead.checkedAt || new Date().toISOString(),
    scrapedBy: lead.scrapedBy || userContext.email || 'Tim Member'
  }, userContext);

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Batch save / sync leads to Firestore cloud with strict user ownership injection
 */
export async function batchSyncLeadsToCloud(
  leads: BusinessLead[], 
  user?: UserContext | string
): Promise<{ syncedCount: number }> {
  if (!leads || leads.length === 0) return { syncedCount: 0 };

  const userContext: UserContext = typeof user === 'string' 
    ? { email: user } 
    : (user || { email: 'anonymous@team.internal' });

  const batch = writeBatch(db);
  let count = 0;

  // Firestore batches max 500 writes
  const slice = leads.slice(0, 450);

  for (const lead of slice) {
    const leadId = lead.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, CLOUD_LEADS_COLLECTION, leadId);

    const payload = sanitizeLeadPayload({
      ...lead,
      id: leadId,
      checkedAt: lead.checkedAt || new Date().toISOString(),
      scrapedBy: lead.scrapedBy || userContext.email || 'Tim Member'
    }, userContext);

    batch.set(docRef, payload, { merge: true });
    count++;
  }

  await batch.commit();
  return { syncedCount: count };
}

export const batchSyncUserLeadsToCloud = batchSyncLeadsToCloud;


/**
 * Fetch all leads belonging to a specific user from cloud
 */
export async function fetchUserCloudLeads(user: UserContext): Promise<BusinessLead[]> {
  if (!user || !user.email) return [];
  const cleanEmail = user.email.trim().toLowerCase();

  try {
    const leadsCollection = collection(db, CLOUD_LEADS_COLLECTION);
    const q = user.isRootAdmin 
      ? query(leadsCollection, limit(1000))
      : query(leadsCollection, where('ownerEmail', '==', cleanEmail), limit(1000));

    const querySnapshot = await getDocs(q);
    const leads: BusinessLead[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as BusinessLead;
      leads.push({ ...data, id: docSnap.id });
    });
    return leads;
  } catch (err) {
    console.error('Failed to fetch user cloud leads:', err);
    return [];
  }
}

/**
 * Fetch all leads from cloud (Root Admin only)
 */
export async function fetchAllCloudLeads(): Promise<BusinessLead[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CLOUD_LEADS_COLLECTION));
    const leads: BusinessLead[] = [];
    querySnapshot.forEach((docSnap) => {
      leads.push({ ...(docSnap.data() as BusinessLead), id: docSnap.id });
    });
    return leads;
  } catch (err) {
    console.error('Failed to fetch cloud leads:', err);
    return [];
  }
}

/**
 * Delete lead from cloud
 */
export async function deleteLeadFromCloud(leadId: string): Promise<void> {
  const docRef = doc(db, CLOUD_LEADS_COLLECTION, leadId);
  await deleteDoc(docRef);
}

