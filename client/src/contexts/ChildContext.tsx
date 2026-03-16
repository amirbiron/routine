import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Child = {
  id: number;
  userId: number;
  name: string;
  avatarColor: string;
  sortOrder: number;
  createdAt: Date;
};

type ChildContextType = {
  children: Child[];
  activeChild: Child | null;
  activeChildId: number | undefined;
  setActiveChildId: (id: number) => void;
  isLoading: boolean;
  refetch: () => void;
};

const ChildContext = createContext<ChildContextType>({
  children: [],
  activeChild: null,
  activeChildId: undefined,
  setActiveChildId: () => {},
  isLoading: true,
  refetch: () => {},
});

const STORAGE_KEY = "routine_active_child_id";

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: childrenData = [], isLoading, refetch } = trpc.children.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  // סנכרון הילד הפעיל — אם ה-ID השמור לא קיים ברשימה, בחר את הראשון
  const activeChild = childrenData.find(c => c.id === selectedId) ?? childrenData[0] ?? null;
  const activeChildId = activeChild?.id;

  useEffect(() => {
    if (activeChildId != null) {
      localStorage.setItem(STORAGE_KEY, String(activeChildId));
    }
  }, [activeChildId]);

  const setActiveChildId = useCallback((id: number) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  return (
    <ChildContext.Provider
      value={{
        children: childrenData as Child[],
        activeChild: activeChild as Child | null,
        activeChildId,
        setActiveChildId,
        isLoading,
        refetch: () => refetch(),
      }}
    >
      {reactChildren}
    </ChildContext.Provider>
  );
}

export function useActiveChild() {
  return useContext(ChildContext);
}
