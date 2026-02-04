"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import type { CoverLetter, CoverLetterData } from "@/types";
import { toast } from "sonner";

// Default empty data
export const emptyCoverLetterData: CoverLetterData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  },
  recipientInfo: {
    managerName: "",
    companyName: "",
    address: "",
    city: "",
    zipCode: "",
    email: "",
  },
  content: {
    subject: "",
    greeting: "Dear Hiring Manager,",
    opening: "",
    body: "",
    closing: "Sincerely,",
    signature: "",
  },
  metadata: {},
};

interface CoverLetterContextType {
  coverLetters: CoverLetter[];
  currentCoverLetter: CoverLetter | null;
  coverLetterData: CoverLetterData;
  isLoading: boolean;
  createCoverLetter: (title: string, template: string, initialData?: CoverLetterData) => Promise<CoverLetter>;
  loadCoverLetter: (id: string) => Promise<void>;
  deleteCoverLetter: (id: string) => Promise<void>;
  updateCoverLetterData: (data: Partial<CoverLetterData>) => void;
  updatePersonalInfo: (info: Partial<CoverLetterData['personalInfo']>) => void;
  updateRecipientInfo: (info: Partial<CoverLetterData['recipientInfo']>) => void;
  updateContent: (content: Partial<CoverLetterData['content']>) => void;
  updateMetadata: (metadata: Partial<NonNullable<CoverLetterData['metadata']>>) => void;
  saveCoverLetter: (isAutoSave?: boolean) => Promise<void>;
  syncGuestData: () => Promise<void>;
  importedData: CoverLetterData | null;
  setImportedData: (data: CoverLetterData | null) => void;
}

export const CoverLetterContext = createContext<CoverLetterContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = "resupra_guest_cl_";

export function CoverLetterProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const currentPathId = params?.id as string;

  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [currentCoverLetter, setCurrentCoverLetter] = useState<CoverLetter | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(emptyCoverLetterData);
  const [importedData, setImportedData] = useState<CoverLetterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getLocalLetters = useCallback(() => {
    const guestLetters: CoverLetter[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key)!);
          guestLetters.push({
              ...data.letter,
              createdAt: new Date(data.letter.createdAt),
              updatedAt: new Date(data.letter.updatedAt),
          });
        } catch (e) {
          console.error("Error parsing local cover letter", e);
        }
      }
    }
    return guestLetters;
  }, []);

  const refreshCoverLetters = useCallback(async () => {
    const localLetters = getLocalLetters();

    if (!session?.user) {
      setCoverLetters(localLetters.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      return;
    }

    // Load from API (not implemented yet, but combining for now)
    setCoverLetters(localLetters.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
  }, [session?.user, getLocalLetters]);

  useEffect(() => {
    refreshCoverLetters();
  }, [session?.user, refreshCoverLetters]);

  const syncGuestData = useCallback(async () => {
    if (!session?.user) return;
    
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
        localKeys.push(key);
      }
    }

    if (localKeys.length === 0) return;

    setIsLoading(true);
    let syncedCurrentId: string | null = null;

    try {
      for (const key of localKeys) {
        const localData = JSON.parse(localStorage.getItem(key)!);
        const oldId = localData.letter.id;

        // Simulate API call for sync
        localStorage.removeItem(key);
        
        if (oldId === currentPathId) {
            syncedCurrentId = "synced-" + oldId; 
        }
      }
      await refreshCoverLetters();

      if (syncedCurrentId) {
        router.replace(`/cover-letter/${syncedCurrentId}`);
      }
    } catch (error) {
        console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, refreshCoverLetters, currentPathId, router]);

  useEffect(() => {
    if (session?.user) {
      syncGuestData();
    }
  }, [session?.user, syncGuestData]);

  const createCoverLetter = useCallback(
    async (title: string, template: string, initialData?: CoverLetterData) => {
      const dataToUse = initialData || emptyCoverLetterData;

      if (!session?.user) {
        const guestId = `local-${Date.now()}`;
        const newLetter: CoverLetter = {
          id: guestId,
          userId: "guest",
          title,
          template,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${guestId}`, JSON.stringify({
          letter: newLetter,
          data: dataToUse
        }));
        
        setCoverLetters((prev) => [newLetter, ...prev]);
        setCurrentCoverLetter(newLetter);
        setCoverLetterData(dataToUse);
        return newLetter;
      }

      // API fallback
      const newLetter: CoverLetter = {
        id: Date.now().toString(),
        userId: session.user.id,
        title,
        template,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentCoverLetter(newLetter);
      setCoverLetterData(dataToUse);
      return newLetter;
    },
    [session?.user]
  );

  const loadCoverLetter = useCallback(async (id: string) => {
    if (currentCoverLetter?.id === id) return;

    if (id.startsWith("local-")) {
      const local = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${id}`);
      if (local) {
        const parsed = JSON.parse(local);
        setCurrentCoverLetter({
            ...parsed.letter,
            createdAt: new Date(parsed.letter.createdAt),
            updatedAt: new Date(parsed.letter.updatedAt),
        });
        setCoverLetterData(parsed.data);
      }
      return;
    }
  }, [currentCoverLetter?.id]);

  const deleteCoverLetter = useCallback(async (id: string) => {
    if (id.startsWith("local-")) {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${id}`);
        setCoverLetters(prev => prev.filter(l => l.id !== id));
        if (currentCoverLetter?.id === id) {
            setCurrentCoverLetter(null);
            setCoverLetterData(emptyCoverLetterData);
        }
        toast.success("Deleted");
    }
  }, [currentCoverLetter?.id]);

  const updateCoverLetterData = useCallback((data: Partial<CoverLetterData>) => {
    setCoverLetterData(prev => ({ ...prev, ...data }));
  }, []);

  const updatePersonalInfo = useCallback((info: Partial<CoverLetterData['personalInfo']>) => {
    setCoverLetterData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info }
    }));
  }, []);

  const updateRecipientInfo = useCallback((info: Partial<CoverLetterData['recipientInfo']>) => {
    setCoverLetterData(prev => ({
      ...prev,
      recipientInfo: { ...prev.recipientInfo, ...info }
    }));
  }, []);

  const updateContent = useCallback((content: Partial<CoverLetterData['content']>) => {
    setCoverLetterData(prev => ({
      ...prev,
      content: { ...prev.content, ...content }
    }));
  }, []);

  const updateMetadata = useCallback((metadata: Partial<NonNullable<CoverLetterData['metadata']>>) => {
    setCoverLetterData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...metadata }
    }));
  }, []);

  const saveCoverLetter = useCallback(async (isAutoSave = false) => {
    if (currentCoverLetter?.id.startsWith("local-")) {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${currentCoverLetter.id}`, JSON.stringify({
            letter: { ...currentCoverLetter, updatedAt: new Date() },
            data: coverLetterData
        }));
        if (!isAutoSave) toast.success("Saved locally");
        return;
    }
    // Simulate API save for now (or implement real API call if available)
    if (!isAutoSave) toast.success("Saved!");
  }, [currentCoverLetter, coverLetterData]);

  // Auto-save effect
  useEffect(() => {
    if (!currentCoverLetter) return;

    const timer = setTimeout(() => {
        saveCoverLetter(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [coverLetterData, saveCoverLetter, currentCoverLetter]);

  const value = useMemo(
    () => ({
      coverLetters,
      currentCoverLetter,
      coverLetterData,
      isLoading,
      createCoverLetter,
      loadCoverLetter,
      deleteCoverLetter,
      updateCoverLetterData,
      updatePersonalInfo,
      updateRecipientInfo,
      updateContent,
      updateMetadata,
      saveCoverLetter,
      syncGuestData,
      importedData,
      setImportedData,
    }),
    [
      coverLetters,
      currentCoverLetter,
      coverLetterData,
      isLoading,
      createCoverLetter,
      loadCoverLetter,
      deleteCoverLetter,
      updateCoverLetterData,
      updatePersonalInfo,
      updateRecipientInfo,
      updateContent,
      updateMetadata,
      saveCoverLetter,
      syncGuestData,
      importedData,
      setImportedData,
    ]
  );

  return <CoverLetterContext.Provider value={value}>{children}</CoverLetterContext.Provider>;
}

export function useCoverLetter() {
  const context = useContext(CoverLetterContext);
  if (context === undefined) {
    throw new Error("useCoverLetter must be used within a CoverLetterProvider");
  }
  return context;
}
