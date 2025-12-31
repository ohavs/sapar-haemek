import { collection, addDoc, getDocs, query, where, Timestamp, doc, onSnapshot, setDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Booking {
    id?: string;
    barberId: string | number;
    barberName: string;
    date: Date;
    time: string;
    customerName: string;
    customerPhone: string;
    service?: string;
    price?: number;
    duration?: number;
    createdAt: Date;
}

export interface BlockedDate {
    id?: string;
    date: Date;
    reason?: string;
    barberId?: string | number; // Optional: specific barber block
    start?: string; // HH:MM
    end?: string;   // HH:MM
}

const COLLECTION_BOOKINGS = 'bookings';
const COLLECTION_BLOCKED = 'blocked_dates';
const COLLECTION_USERS = 'users';

// --- Bookings ---

export const saveUser = async (name: string, phone: string) => {
    try {
        const userRef = doc(db, COLLECTION_USERS, phone);
        await setDoc(userRef, {
            name,
            phone,
            lastVisit: Timestamp.now(),
            totalVisits: increment(1)
        }, { merge: true });
    } catch (error) {
        console.error("Error saving user:", error);
        // Don't block booking if user save fails, just log it.
    }
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    // 1. Double check availability before booking (simple check)
    const taken = await checkSlotAvailability(booking.date, booking.time, booking.barberId);
    if (!taken) {
        throw new Error("התור נתפס רגע לפני שאישרת. אנא בחר שעה אחרת.");
    }

    // 2. Add booking
    try {
        const docRef = await addDoc(collection(db, COLLECTION_BOOKINGS), {
            ...booking,
            createdAt: Timestamp.now(),
            date: Timestamp.fromDate(booking.date)
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating booking: ", error);
        throw error;
    }
};

export const checkSlotAvailability = async (date: Date, time: string, barberId: string | number) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Check existing bookings
    const qBookings = query(
        collection(db, COLLECTION_BOOKINGS),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
    );

    // 2. Check blocked dates
    const qBlocked = query(
        collection(db, COLLECTION_BLOCKED),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
    );

    const [snapBookings, snapBlocked] = await Promise.all([
        getDocs(qBookings),
        getDocs(qBlocked)
    ]);

    // Check Bookings
    const isBookingTaken = snapBookings.docs.some(doc => {
        const data = doc.data();
        return data.time === time && String(data.barberId) === String(barberId);
    });

    if (isBookingTaken) return false;

    // Check Blocks
    const isBlocked = snapBlocked.docs.some(doc => {
        const data = doc.data();
        const sameBarber = !data.barberId || String(data.barberId) === String(barberId);
        if (!sameBarber) return false;

        // Full day block
        if (!data.start || !data.end) return true;

        // Partial block - Check overlap
        // slot time vs block range
        // We assume slot duration 30m? Or just start time check?
        // Ideally we check if `time` is >= start && time < end
        // Simplest: Check if the *start* of the slot is inside the blocked range.
        // Assuming strictly formatted HH:MM strings comparison works for 24h format.
        return time >= data.start && time < data.end;
    });

    return !isBlocked;
};

export const getBookingsByDate = async (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate()
        } as Booking;
    });
};

export const getUserHistory = async (phone: string) => {
    // Simple query by phone only to avoid composite index requirement
    const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where("customerPhone", "==", phone)
    );

    try {
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
                createdAt: data.createdAt.toDate()
            } as Booking;
        });

        // Sort client-side
        return bookings.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (e) {
        console.error("Error fetching user history:", e);
        return [];
    }
};

// --- Blocked Dates (Admin) ---

export const blockDate = async (date: Date, reason: string = "Blocked by Admin", barberId?: string | number, start?: string, end?: string) => {
    // Normalize to midnight to avoid duplicates easily
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if already blocked for this scope
    const queryStart = normalizedDate;
    const queryEnd = new Date(normalizedDate);
    queryEnd.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, COLLECTION_BLOCKED),
        where("date", ">=", Timestamp.fromDate(queryStart)),
        where("date", "<=", Timestamp.fromDate(queryEnd))
    );

    const snap = await getDocs(q);

    // Check for duplicate block (same scope)
    const isDuplicate = snap.docs.some(doc => {
        const data = doc.data();

        // Scope Check (Barber)
        const sameBarber = String(data.barberId) === String(barberId);
        if (!sameBarber) return false;

        // Time Check
        const existingFull = !data.start || !data.end;
        const newFull = !start || !end;

        if (existingFull && newFull) return true; // Collision: both full -> duplicate

        // If one is full and other partial, we might allow it (e.g. blocking specific hours on top of full day? No, full day blocks everything).
        // If existing is Full, new Partial is redundant but technically a valid request? No, it's blocked anyway.
        if (existingFull && !newFull) return true; // Already blocked fully

        // If existing is Partial and new is Full -> Collision? Yes, we want to block fully now.
        // Actually, if we block fully, we might want to override or just add it.
        // Let's prevent EXACT duplicates of partials.
        if (!existingFull && !newFull) {
            return data.start === start && data.end === end;
        }

        return false;
    });

    if (isDuplicate) return;

    await addDoc(collection(db, COLLECTION_BLOCKED), {
        date: Timestamp.fromDate(normalizedDate),
        reason,
        barberId: barberId || null, // Explicit null for global
        start: start || null,
        end: end || null
    });
};

export const getBlockedDates = async () => {
    // Get all blocked dates (efficient enough for small scale)
    // Or filter by current month/future
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, COLLECTION_BLOCKED),
        where("date", ">=", Timestamp.fromDate(now))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        date: doc.data().date.toDate(),
        reason: doc.data().reason,
        barberId: doc.data().barberId,
        start: doc.data().start,
        end: doc.data().end
    } as BlockedDate));
};

// --- Realtime Listeners (Optional but good) ---
export const subscribeToBookings = (date: Date, callback: (bookings: Booking[]) => void) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end))
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate()
        } as Booking));
        callback(bookings);
    });
};

export const deleteBooking = async (id: string) => {
    await deleteDoc(doc(db, COLLECTION_BOOKINGS, id));
};

export const subscribeToFutureBookings = (callback: (bookings: Booking[]) => void) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, COLLECTION_BOOKINGS),
        where("date", ">=", Timestamp.fromDate(today))
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate()
        } as Booking));

        // Sort by date ascending
        bookings.sort((a, b) => a.date.getTime() - b.date.getTime());
        callback(bookings);
    });
};

export const deleteBlockedDate = async (id: string) => {
    await deleteDoc(doc(db, COLLECTION_BLOCKED, id));
};

export const updateBooking = async (id: string, updates: Partial<Booking>) => {
    const bookingRef = doc(db, COLLECTION_BOOKINGS, id);
    // If date is being updated, ensure it's Timestamp for Firestore
    const dataToUpdate = { ...updates };
    if (updates.date) {
        // @ts-ignore - Firestore expects Timestamp or Date, but type definition might be strict
        dataToUpdate.date = Timestamp.fromDate(updates.date);
    }
    await setDoc(bookingRef, dataToUpdate, { merge: true });
};
