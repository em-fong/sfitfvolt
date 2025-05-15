import { create } from 'zustand';
import type { Event, Volunteer } from '@shared/schema';

interface CheckInStore {
  // Selected volunteer for check-in
  selectedVolunteer: Volunteer | null;
  setSelectedVolunteer: (volunteer: Volunteer | null) => void;
  
  // Check-in method (qr or manual)
  checkInMethod: 'qr' | 'manual';
  setCheckInMethod: (method: 'qr' | 'manual') => void;
  
  // Check-in timestamp
  checkInTimestamp: Date | null;
  setCheckInTimestamp: (timestamp: Date) => void;
  
  // Clear store
  clearCheckInData: () => void;
}

export const useCheckInStore = create<CheckInStore>((set) => ({
  selectedVolunteer: null,
  setSelectedVolunteer: (volunteer) => set({ selectedVolunteer: volunteer }),
  
  checkInMethod: 'qr',
  setCheckInMethod: (method) => set({ checkInMethod: method }),
  
  checkInTimestamp: null,
  setCheckInTimestamp: (timestamp) => set({ checkInTimestamp: timestamp }),
  
  clearCheckInData: () => set({
    selectedVolunteer: null,
    checkInMethod: 'qr',
    checkInTimestamp: null
  })
}));
