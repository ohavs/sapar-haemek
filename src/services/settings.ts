import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_SETTINGS = 'settings';
const COLLECTION_SERVICES = 'services';
const DOC_GENERAL = 'general';
const DOC_SCHEDULE = 'schedule';

export interface AdminSettings {
    adminPassword?: string;
    vacationMode: boolean;
}

export interface Service {
    id?: string;
    name: string;
    price: number;
    duration: number; // in minutes
    note?: string;
}

export interface WeeklySchedule {
    workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    hours: {
        [key: number]: { start: string; end: string }; // day -> { start, end }
    };
    breaks: {
        [key: number]: { start: string; end: string; barberId?: string }[]; // Changed to string to match barber settings
    };
    slotDuration: number; // minutes
    bufferTime: number; // minutes
}

// --- General Settings (Password, Vacation) ---

export const getAdminSettings = async (): Promise<AdminSettings> => {
    const d = await getDoc(doc(db, COLLECTION_SETTINGS, DOC_GENERAL));
    if (!d.exists()) {
        // Initialize defaults if not exists
        const defaults: AdminSettings = {
            adminPassword: '123', // Initial seed
            vacationMode: false
        };
        await setDoc(doc(db, COLLECTION_SETTINGS, DOC_GENERAL), defaults);
        return defaults;
    }
    return d.data() as AdminSettings;
};

export const updateAdminSettings = async (settings: Partial<AdminSettings>) => {
    await setDoc(doc(db, COLLECTION_SETTINGS, DOC_GENERAL), settings, { merge: true });
};

export const subscribeToSettings = (callback: (settings: AdminSettings) => void) => {
    return onSnapshot(doc(db, COLLECTION_SETTINGS, DOC_GENERAL), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as AdminSettings);
        }
    });
};

// --- Schedule Settings ---

export const getScheduleSettings = async (): Promise<WeeklySchedule> => {
    const d = await getDoc(doc(db, COLLECTION_SETTINGS, DOC_SCHEDULE));
    if (!d.exists()) {
        // Default schedule: Sun-Thu, 10:00-20:00
        const defaults: WeeklySchedule = {
            workingDays: [0, 1, 2, 3, 4],
            hours: {
                0: { start: '10:00', end: '20:00' },
                1: { start: '10:00', end: '20:00' },
                2: { start: '10:00', end: '20:00' },
                3: { start: '10:00', end: '20:00' },
                4: { start: '10:00', end: '20:00' }
            },
            breaks: {},
            slotDuration: 30,
            bufferTime: 5
        };
        await setDoc(doc(db, COLLECTION_SETTINGS, DOC_SCHEDULE), defaults);
        return defaults;
    }
    return d.data() as WeeklySchedule;
};

export const updateScheduleSettings = async (schedule: WeeklySchedule) => {
    await setDoc(doc(db, COLLECTION_SETTINGS, DOC_SCHEDULE), schedule);
};

export const subscribeToSchedule = (callback: (schedule: WeeklySchedule) => void) => {
    return onSnapshot(doc(db, COLLECTION_SETTINGS, DOC_SCHEDULE), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as WeeklySchedule);
        }
    });

};

// --- Services Management ---

export const getServices = async (): Promise<Service[]> => {
    const s = await getDocs(collection(db, COLLECTION_SERVICES));
    return s.docs.map(d => ({ id: d.id, ...d.data() } as Service));
};

export const addService = async (service: Service) => {
    await addDoc(collection(db, COLLECTION_SERVICES), service);
};

export const deleteService = async (id: string) => {
    await deleteDoc(doc(db, COLLECTION_SERVICES, id));
};

export const updateService = async (id: string, service: Partial<Service>) => {
    await setDoc(doc(db, COLLECTION_SERVICES, id), service, { merge: true });
};

export const subscribeToServices = (callback: (services: Service[]) => void) => {
    return onSnapshot(collection(db, COLLECTION_SERVICES), (snapshot) => {
        const services = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service));
        callback(services);
    });
};
