import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, orderBy, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BARBERS as INITIAL_BARBERS } from '../data';

export const COLLECTION_BARBERS = 'barbers';

export interface Barber {
    id: number | string; // Supporting both for migration
    name: string;
    specialty: string;
    image: string;
}

// Get all barbers
export const getBarbers = async (): Promise<Barber[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_BARBERS));
    if (snapshot.empty) {
        // Seed initial data
        // We use setDoc to preserve IDs if possible, or just addDoc
        const batchPromises = INITIAL_BARBERS.map(b =>
            setDoc(doc(db, COLLECTION_BARBERS, b.id.toString()), b)
        );
        await Promise.all(batchPromises);
        return INITIAL_BARBERS;
    }
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
};

// Subscribe to barbers
export const subscribeToBarbers = (callback: (barbers: Barber[]) => void) => {
    // Check and seed if empty
    getBarbers().catch(console.error);

    const q = query(collection(db, COLLECTION_BARBERS)); // orderBy if needed
    return onSnapshot(q, (snapshot) => {
        const barbers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Barber));
        // Sort by ID to keep order consistent? Or add an order field. 
        // For now, simple sort if IDs are numeric-like
        barbers.sort((a, b) => Number(a.id) - Number(b.id));
        callback(barbers);
    });
};

// Update barber (image, etc)
export const updateBarber = async (id: string, updates: Partial<Barber>) => {
    await updateDoc(doc(db, COLLECTION_BARBERS, id), updates);
};

export const addBarber = async (barber: Omit<Barber, 'id'>) => {
    await addDoc(collection(db, COLLECTION_BARBERS), barber);
};

export const deleteBarber = async (id: string) => {
    await deleteDoc(doc(db, COLLECTION_BARBERS, id));
};

// Helper to upload image (placeholder/stub - actual implementation requires Firebase Storage)
// For now, we will handle image as URL string update. The UI will handle file -> URL via another service or base64 if small (bad practice)
// or ideally Firebase Storage.
// Since User didn't explicitly check setup for Storage, I will verify if I can add a Storage service.
// I'll leave the actual binary upload logic to a separate utility called by the UI.
