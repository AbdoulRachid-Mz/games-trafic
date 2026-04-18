"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2 } from "lucide-react";
import { updateBracketNode } from "@/actions/phases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface UpdateBracketNodeDialogProps {
  node: {
    id: string;
    nodeCode: string | null;
    round: number | null;
    matchNumber: number | null;
    bracketType: string | null;
  };
  revalidatePath: string;
  asFormOnly?: boolean;
}

export function UpdateBracketNodeDialog({
  node,
  revalidatePath: path,
  asFormOnly = false,
}: UpdateBracketNodeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const nodeCode = (formData.get("nodeCode") as string || "").trim();
    const round = Number(formData.get("round") || 1);
    const matchNumber = Number(formData.get("matchNumber") || 1);
    const bracketType = (formData.get("bracketType") as string) || "UPPER";

    try {
      await updateBracketNode(node.id, {
        nodeCode,
        round,
        matchNumber,
        bracketType,
      } as any);

      toast.success("Nœud mis à jour avec succès");
      if (!asFormOnly) {
        setOpen(false);
      } else {
        router.back();
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={!asFormOnly ? "space-y-4 pt-4" : "space-y-4"}>
      <div className="space-y-2">
        <Label htmlFor="nodeCode">Code d'identification</Label>
        <Input
          id="nodeCode"
          name="nodeCode"
          defaultValue={node.nodeCode || ""}
          placeholder="ex: QF1"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="round">Round</Label>
          <Input
            id="round"
            name="round"
            type="number"
            min={1}
            defaultValue={node.round || 1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="matchNumber">Match #</Label>
          <Input
            id="matchNumber"
            name="matchNumber"
            type="number"
            min={1}
            defaultValue={node.matchNumber || 1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bracketType">Position Bracket</Label>
        <select
          id="bracketType"
          name="bracketType"
          defaultValue={node.bracketType || "UPPER"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="UPPER">Upper Bracket (WB)</option>
          <option value="LOWER">Lower Bracket (LB)</option>
          <option value="FINAL">Grand Final</option>
        </select>
      </div>

      <div className="flex gap-2 sm:gap-0 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => asFormOnly ? router.back() : setOpen(false)}
          disabled={loading}
          className="mr-2"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );

  if (asFormOnly) {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
           Modifier le nœud
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le nœud</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
