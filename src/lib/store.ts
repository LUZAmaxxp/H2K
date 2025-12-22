import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Intervention form state
interface InterventionFormState {
  step: number;
  data: {
    startDate: string;
    endDate: string;
    entrepriseName: string;
    responsable: string;
    teamMembers: string[];
    siteName: string;
    photoUrl?: string;
    recipientEmails: string[];
  };
  setStep: (step: number) => void;
  updateData: (data: Partial<InterventionFormState['data']>) => void;
  reset: () => void;
}

// Reclamation form state
interface ReclamationFormState {
  step: number;
  data: {
    date: string;
    stationName: string;
    reclamationType: 'hydraulic' | 'electric' | 'mechanic';
    description: string;
    photoUrl?: string;
    recipientEmails: string[];
  };
  setStep: (step: number) => void;
  updateData: (data: Partial<ReclamationFormState['data']>) => void;
  reset: () => void;
}

// Combined store
interface AppStore {
  interventionForm: InterventionFormState;
  reclamationForm: ReclamationFormState;
}

const initialInterventionData = {
  startDate: '',
  endDate: '',
  entrepriseName: '',
  responsable: '',
  teamMembers: [],
  siteName: '',
  photoUrl: '',
  recipientEmails: [],
};

const initialReclamationData = {
  date: '',
  stationName: '',
  reclamationType: 'hydraulic' as const,
  description: '',
  photoUrl: '',
  recipientEmails: [],
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      interventionForm: {
        step: 1,
        data: initialInterventionData,
        setStep: (step) =>
          set((state) => ({
            interventionForm: { ...state.interventionForm, step },
          })),
        updateData: (data) =>
          set((state) => ({
            interventionForm: {
              ...state.interventionForm,
              data: { ...state.interventionForm.data, ...data },
            },
          })),
        reset: () =>
          set((state) => ({
            interventionForm: {
              ...state.interventionForm,
              step: 1,
              data: initialInterventionData,
            },
          })),
      },
      reclamationForm: {
        step: 1,
        data: initialReclamationData,
        setStep: (step) =>
          set((state) => ({
            reclamationForm: { ...state.reclamationForm, step },
          })),
        updateData: (data) =>
          set((state) => ({
            reclamationForm: {
              ...state.reclamationForm,
              data: { ...state.reclamationForm.data, ...data },
            },
          })),
        reset: () =>
          set((state) => ({
            reclamationForm: {
              ...state.reclamationForm,
              step: 1,
              data: initialReclamationData,
            },
          })),
      },
    }),
    { name: 'app-store' }
  )
);
