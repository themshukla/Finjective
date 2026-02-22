import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MoveOption {
  id: string;
  label: string;
}

interface EditItemDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { key: string; label: string; type: "text" | "number"; value: string | number }[];
  onSave: (values: Record<string, string | number>) => void;
  onDelete?: () => void;
  currentSectionId?: string;
  moveOptions?: MoveOption[];
  onMove?: (targetSectionId: string) => void;
}

const EditItemDialog = ({ open, onClose, title, fields, onSave, onDelete, currentSectionId, moveOptions, onMove }: EditItemDialogProps) => {
  const [values, setValues] = useState<Record<string, string | number>>(
    Object.fromEntries(fields.map((f) => [f.key, f.type === "number" && f.value === 0 ? "" : f.value]))
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  const handleMove = (targetId: string) => {
    if (targetId && targetId !== currentSectionId) {
      onSave(values);
      onMove?.(targetId);
      onClose();
    }
  };

  const availableMoveOptions = moveOptions?.filter(o => o.id !== currentSectionId);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {fields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <Input
                type={f.type}
                value={values[f.key]}
                placeholder={f.type === "number" ? "$0.00" : ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="mt-1 h-10"
              />
              </div>
            ))}
            {availableMoveOptions && availableMoveOptions.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Move to</Label>
                <Select onValueChange={handleMove}>
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue placeholder="Select section…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMoveOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {onDelete && (
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              )}
              <Button size="sm" className="flex-1" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[340px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete?.(); onClose(); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditItemDialog;
