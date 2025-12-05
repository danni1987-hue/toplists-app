import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Check, X } from "lucide-react";
import { api } from "../utils/api";
import { toast } from "sonner";

interface FollowRequest {
  requestId: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  timestamp: string;
}

interface FollowRequestsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null;
}

export function FollowRequestsSheet({
  open,
  onOpenChange,
  accessToken,
}: FollowRequestsSheetProps) {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && accessToken) {
      loadRequests();
    }
  }, [open, accessToken]);

  const loadRequests = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await api.getFollowRequests(accessToken);
      setRequests(response.requests);
    } catch (error) {
      console.error("Error loading follow requests:", error);
      toast.error("Error al cargar solicitudes de seguimiento");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!accessToken) return;

    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      await api.acceptFollowRequest(requestId, accessToken);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      toast.success("Solicitud de seguimiento aceptada");
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Error al aceptar la solicitud");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!accessToken) return;

    setProcessingIds((prev) => new Set(prev).add(requestId));

    try {
      await api.rejectFollowRequest(requestId, accessToken);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      toast.success("Solicitud de seguimiento rechazada");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Error al rechazar la solicitud");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Solicitudes de seguimiento</SheetTitle>
          <SheetDescription>
            Personas que quieren seguirte
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Cargando...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No tienes solicitudes de seguimiento pendientes
            </div>
          ) : (
            requests.map((request) => {
              const isProcessing = processingIds.has(request.requestId);

              return (
                <div
                  key={request.requestId}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={request.user.avatar}
                      alt={request.user.username}
                      className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        @{request.user.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.timestamp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.requestId)}
                      disabled={isProcessing}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.requestId)}
                      disabled={isProcessing}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
