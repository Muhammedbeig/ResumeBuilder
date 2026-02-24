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
import { useSession } from "@/lib/auth-client";
import type { CoverLetter, CoverLetterData } from "@/types";
import { toast } from "sonner";

const COVER_LETTERS_STORAGE_KEY = "resupro_cover_letters_v1";
const COVER_LETTER_DATA_STORAGE_KEY = "resupro_cover_letter_data_v1";

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
  createCoverLetter: (
    title: string,
    template: string,
    initialData?: CoverLetterData,
  ) => Promise<CoverLetter>;
  loadCoverLetter: (id: string) => Promise<void>;
  deleteCoverLetter: (id: string) => Promise<void>;
  updateCoverLetterData: (data: Partial<CoverLetterData>) => void;
  updatePersonalInfo: (info: Partial<CoverLetterData["personalInfo"]>) => void;
  updateRecipientInfo: (
    info: Partial<CoverLetterData["recipientInfo"]>,
  ) => void;
  updateContent: (content: Partial<CoverLetterData["content"]>) => void;
  updateMetadata: (
    metadata: Partial<NonNullable<CoverLetterData["metadata"]>>,
  ) => void;
  saveCoverLetter: (isAutoSave?: boolean) => Promise<void>;
  syncGuestData: () => Promise<void>;
  importedData: CoverLetterData | null;
  setImportedData: (data: CoverLetterData | null) => void;
}

export const CoverLetterContext = createContext<
  CoverLetterContextType | undefined
>(undefined);

type PersistedCoverLetter = Omit<CoverLetter, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function normalizeCoverLetterData(
  data?: Partial<CoverLetterData> | null,
): CoverLetterData {
  const source = data ?? {};
  return {
    personalInfo: {
      ...emptyCoverLetterData.personalInfo,
      ...(source.personalInfo ?? {}),
    },
    recipientInfo: {
      ...emptyCoverLetterData.recipientInfo,
      ...(source.recipientInfo ?? {}),
    },
    content: {
      ...emptyCoverLetterData.content,
      ...(source.content ?? {}),
    },
    metadata: {
      ...(emptyCoverLetterData.metadata ?? {}),
      ...(source.metadata ?? {}),
    },
  };
}

function toPersistedCoverLetter(letter: CoverLetter): PersistedCoverLetter {
  return {
    ...letter,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  };
}

function parseCoverLetter(letter: PersistedCoverLetter): CoverLetter {
  return {
    ...letter,
    createdAt: new Date(letter.createdAt),
    updatedAt: new Date(letter.updatedAt),
  };
}

function readPersistedLetters(): CoverLetter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COVER_LETTERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedCoverLetter[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseCoverLetter);
  } catch {
    return [];
  }
}

function writePersistedLetters(letters: CoverLetter[]) {
  if (typeof window === "undefined") return;
  const payload = letters.map(toPersistedCoverLetter);
  window.localStorage.setItem(
    COVER_LETTERS_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

function readPersistedDataMap(): Record<string, CoverLetterData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COVER_LETTER_DATA_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<CoverLetterData>>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([id, value]) => [
        id,
        normalizeCoverLetterData(value),
      ]),
    );
  } catch {
    return {};
  }
}

function writePersistedDataMap(dataMap: Record<string, CoverLetterData>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    COVER_LETTER_DATA_STORAGE_KEY,
    JSON.stringify(dataMap),
  );
}

export function CoverLetterProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [currentCoverLetter, setCurrentCoverLetter] =
    useState<CoverLetter | null>(null);
  const [coverLetterData, setCoverLetterData] =
    useState<CoverLetterData>(emptyCoverLetterData);
  const [importedData, setImportedData] = useState<CoverLetterData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const getLocalLetters = useCallback(() => {
    if (!session?.user?.id) return [] as CoverLetter[];
    return readPersistedLetters()
      .filter((letter) => letter.userId === session.user?.id)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [session?.user?.id]);

  const refreshCoverLetters = useCallback(async () => {
    const localLetters = getLocalLetters();

    if (!session?.user) {
      setCoverLetters([]);
      setCurrentCoverLetter(null);
      setCoverLetterData(emptyCoverLetterData);
      return;
    }

    setCoverLetters(localLetters);
  }, [session?.user, getLocalLetters]);

  useEffect(() => {
    refreshCoverLetters();
  }, [session?.user, refreshCoverLetters]);

  const syncGuestData = useCallback(async () => {
    return Promise.resolve();
  }, []);

  const createCoverLetter = useCallback(
    async (title: string, template: string, initialData?: CoverLetterData) => {
      const dataToUse = normalizeCoverLetterData(initialData);

      if (!session?.user) {
        throw new Error("Please sign in to create a cover letter.");
      }

      const now = new Date();
      const newLetter: CoverLetter = {
        id: Date.now().toString(),
        userId: session.user.id,
        title,
        template,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      };
      const allLetters = readPersistedLetters();
      writePersistedLetters([newLetter, ...allLetters]);
      const dataMap = readPersistedDataMap();
      dataMap[newLetter.id] = dataToUse;
      writePersistedDataMap(dataMap);

      setCoverLetters((prev) =>
        [newLetter, ...prev].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
        ),
      );
      setCurrentCoverLetter(newLetter);
      setCoverLetterData(dataToUse);
      return newLetter;
    },
    [session?.user],
  );

  const loadCoverLetter = useCallback(
    async (id: string) => {
      if (currentCoverLetter?.id === id) return;

      if (!session?.user?.id) return;

      setIsLoading(true);
      try {
        const allLetters = readPersistedLetters();
        const letter = allLetters.find(
          (item) => item.id === id && item.userId === session.user?.id,
        );

        if (!letter) {
          setCurrentCoverLetter(null);
          setCoverLetterData(emptyCoverLetterData);
          return;
        }

        const dataMap = readPersistedDataMap();
        const data = dataMap[id] ?? emptyCoverLetterData;
        setCurrentCoverLetter(letter);
        setCoverLetterData(normalizeCoverLetterData(data));
      } finally {
        setIsLoading(false);
      }
    },
    [currentCoverLetter?.id, session?.user?.id],
  );

  const deleteCoverLetter = useCallback(
    async (id: string) => {
      if (!session?.user?.id) return;

      const allLetters = readPersistedLetters();
      const nextLetters = allLetters.filter(
        (item) => !(item.id === id && item.userId === session.user?.id),
      );
      writePersistedLetters(nextLetters);

      const dataMap = readPersistedDataMap();
      if (dataMap[id]) {
        delete dataMap[id];
        writePersistedDataMap(dataMap);
      }

      setCoverLetters((prev) => prev.filter((letter) => letter.id !== id));
      if (currentCoverLetter?.id === id) {
        setCurrentCoverLetter(null);
        setCoverLetterData(emptyCoverLetterData);
      }
    },
    [currentCoverLetter?.id, session?.user?.id],
  );

  const updateCoverLetterData = useCallback(
    (data: Partial<CoverLetterData>) => {
      setCoverLetterData((prev) => ({ ...prev, ...data }));
    },
    [],
  );

  const updatePersonalInfo = useCallback(
    (info: Partial<CoverLetterData["personalInfo"]>) => {
      setCoverLetterData((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, ...info },
      }));
    },
    [],
  );

  const updateRecipientInfo = useCallback(
    (info: Partial<CoverLetterData["recipientInfo"]>) => {
      setCoverLetterData((prev) => ({
        ...prev,
        recipientInfo: { ...prev.recipientInfo, ...info },
      }));
    },
    [],
  );

  const updateContent = useCallback(
    (content: Partial<CoverLetterData["content"]>) => {
      setCoverLetterData((prev) => ({
        ...prev,
        content: { ...prev.content, ...content },
      }));
    },
    [],
  );

  const updateMetadata = useCallback(
    (metadata: Partial<NonNullable<CoverLetterData["metadata"]>>) => {
      setCoverLetterData((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, ...metadata },
      }));
    },
    [],
  );

  const saveCoverLetter = useCallback(
    async (isAutoSave = false) => {
      if (!currentCoverLetter) return;
      if (!session?.user?.id) return;

      const allLetters = readPersistedLetters();
      const updatedLetter: CoverLetter = {
        ...currentCoverLetter,
        updatedAt: new Date(),
      };
      const nextLetters = allLetters.map((item) =>
        item.id === updatedLetter.id && item.userId === session.user?.id
          ? updatedLetter
          : item,
      );
      writePersistedLetters(nextLetters);

      const dataMap = readPersistedDataMap();
      dataMap[currentCoverLetter.id] = normalizeCoverLetterData(coverLetterData);
      writePersistedDataMap(dataMap);

      if (!isAutoSave) {
        setCurrentCoverLetter(updatedLetter);
        setCoverLetters((prev) =>
          prev
            .map((item) => (item.id === updatedLetter.id ? updatedLetter : item))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
        );
        toast.success("Saved!");
      }
    },
    [currentCoverLetter, coverLetterData, session?.user?.id],
  );

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
    ],
  );

  return (
    <CoverLetterContext.Provider value={value}>
      {children}
    </CoverLetterContext.Provider>
  );
}

export function useCoverLetter() {
  const context = useContext(CoverLetterContext);
  if (context === undefined) {
    throw new Error("useCoverLetter must be used within a CoverLetterProvider");
  }
  return context;
}
