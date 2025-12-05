import { TopListCard } from "./TopListCard";
import { Button } from "./ui/button";
import { EditListDialog } from "./EditListDialog";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface MyListsViewProps {
  lists: any[];
  onUpdateList: (id: string, updatedList: any) => void;
  onDeleteList: (id: string) => void;
}

export function MyListsView({ lists, onUpdateList, onDeleteList }: MyListsViewProps) {
  const [editingList, setEditingList] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  const handleEdit = (list: any) => {
    setEditingList(list);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setListToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (listToDelete) {
      onDeleteList(listToDelete);
      setListToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-2">Mis Listas</h2>
        <p className="text-muted-foreground">Administra y edita tus listas publicadas</p>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground mb-4">Aún no has creado ninguna lista</p>
          <p className="text-sm text-muted-foreground">¡Crea tu primera lista para empezar!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {lists.map((list) => (
            <div key={list.id} className="relative">
              {/* Action buttons overlay */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2 shadow-md"
                  onClick={() => handleEdit(list)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2 shadow-md"
                  onClick={() => handleDeleteClick(list.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
              
              <TopListCard {...list} />
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <EditListDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        list={editingList}
        onUpdateList={onUpdateList}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La lista será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
