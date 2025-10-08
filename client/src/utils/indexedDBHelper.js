import { openDB } from 'idb';

const DB_NAME = 'swasthai-db';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
const BOOKING_STORE = 'bookings';

// Initialize the database
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for messages if it doesn't exist
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
        messagesStore.createIndex('timestamp', 'timestamp');
      }
      
      // Create a store for bookings if it doesn't exist
      if (!db.objectStoreNames.contains(BOOKING_STORE)) {
        const bookingsStore = db.createObjectStore(BOOKING_STORE, { keyPath: 'id' });
        bookingsStore.createIndex('timestamp', 'timestamp');
        bookingsStore.createIndex('synced', 'synced');
      }
    }
  });
};

// Save a message to IndexedDB
export const saveMessageToIndexedDB = async (message) => {
  try {
    const db = await initDB();
    await db.put(MESSAGES_STORE, message);
    return true;
  } catch (error) {
    console.error('Error saving message to IndexedDB:', error);
    return false;
  }
};

// Get all messages from IndexedDB
export const getMessagesFromIndexedDB = async () => {
  try {
    const db = await initDB();
    return await db.getAllFromIndex(MESSAGES_STORE, 'timestamp');
  } catch (error) {
    console.error('Error getting messages from IndexedDB:', error);
    return [];
  }
};

// Clear all messages from IndexedDB
export const clearMessagesFromIndexedDB = async () => {
  try {
    const db = await initDB();
    await db.clear(MESSAGES_STORE);
    return true;
  } catch (error) {
    console.error('Error clearing messages from IndexedDB:', error);
    return false;
  }
};

// Save a booking to IndexedDB
export const saveBookingToIndexedDB = async (booking) => {
  try {
    const db = await initDB();
    // Mark as not synced by default
    const bookingWithSync = { ...booking, synced: false };
    await db.put(BOOKING_STORE, bookingWithSync);
    return true;
  } catch (error) {
    console.error('Error saving booking to IndexedDB:', error);
    return false;
  }
};

// Get all bookings from IndexedDB
export const getBookingsFromIndexedDB = async () => {
  try {
    const db = await initDB();
    return await db.getAllFromIndex(BOOKING_STORE, 'timestamp');
  } catch (error) {
    console.error('Error getting bookings from IndexedDB:', error);
    return [];
  }
};

// Get unsynced bookings from IndexedDB
export const getUnsyncedBookingsFromIndexedDB = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKING_STORE, 'readonly');
    const index = tx.store.index('synced');
    return await index.getAll(false);
  } catch (error) {
    console.error('Error getting unsynced bookings from IndexedDB:', error);
    return [];
  }
};

// Mark booking as synced in IndexedDB
export const markBookingAsSynced = async (id) => {
  try {
    const db = await initDB();
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    const store = tx.objectStore(BOOKING_STORE);
    const booking = await store.get(id);
    
    if (booking) {
      booking.synced = true;
      await store.put(booking);
    }
    
    await tx.done;
    return true;
  } catch (error) {
    console.error('Error marking booking as synced in IndexedDB:', error);
    return false;
  }
};

// Sync unsynced bookings with server
export const syncBookingsWithServer = async () => {
  try {
    // Check if online
    if (!navigator.onLine) {
      return { success: false, message: 'Offline. Bookings will sync when online.' };
    }
    
    // Get unsynced bookings
    const unsyncedBookings = await getUnsyncedBookingsFromIndexedDB();
    
    if (unsyncedBookings.length === 0) {
      return { success: true, message: 'No bookings to sync.' };
    }
    
    // Sync each booking
    const results = await Promise.all(
      unsyncedBookings.map(async (booking) => {
        try {
          // Send to server
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(booking),
          });
          
          if (response.ok) {
            // Mark as synced
            await markBookingAsSynced(booking.id);
            return { id: booking.id, success: true };
          } else {
            return { id: booking.id, success: false };
          }
        } catch (error) {
          console.error(`Error syncing booking ${booking.id}:`, error);
          return { id: booking.id, success: false };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      message: `Synced ${successCount}/${unsyncedBookings.length} bookings.`,
      results
    };
  } catch (error) {
    console.error('Error syncing bookings with server:', error);
    return { success: false, message: 'Error syncing bookings.' };
  }
};