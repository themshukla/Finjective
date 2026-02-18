import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditItemDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: { key: string; label: string; type: "text" | "number"; value: string | number }[];
  onSave: (values: Record<string, string | number>) => void;
  onDelete?: () => void;
}

const EditItemDialog = ({ open, onClose, title, fields, onSave, onDelete }: EditItemDialogProps) => {
  const [values, setValues] = useState<Record<string, string | number>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return (
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
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))
                }
                className="mt-1 h-10"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            {onDelete && (
              <Button variant="destructive" size="sm" className="flex-1" onClick={() => { onDelete(); onClose(); }}>
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
  );
};

export default EditItemDialog;
