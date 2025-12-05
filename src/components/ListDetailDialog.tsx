import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "./ui/dialog";
import { TopListCard } from "./TopListCard";
import { api } from "../utils/api";
import { Loader2 } from "lucide-react";

interface ListDetailDialogProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken?: string | null;
  currentUser?: {
    username: string;
    avatar: string;
    userId?: string;
  } | null;
}

export function ListDetailDialog({ 
  listId, 
  open, 
  onOpenChange,
  accessToken,
  currentUser 
}: ListDetailDialogProps) {
  const [list, setList] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (listId && open) {
      loadListDetail();
    }
  }, [listId, open]);

  const loadListDetail = async () => {
    if (!listId) return;

    try {
      setIsLoading(true);
      const { list: listData } = await api.getListDetail(listId);
      setList(listData);
    } catch (error) {
      console.error("Error loading list detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : list ? (
          <div className="p-4">
            <TopListCard
              {...list}
              accessToken={accessToken}
              currentUser={currentUser}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
