"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface DialogPopupProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  message: string;
  title?: string;
}

const DialogPopup: React.FC<DialogPopupProps> = ({ 
  open, 
  setOpen, 
  message, 
  title 
}) => {
  const isSuccess = message.toLowerCase().includes("success") || message.toLowerCase().includes("successfully");
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || (isSuccess ? "Success" : "Error")}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 whitespace-pre-line">{message}</div>
        <DialogFooter>
          <Button variant="default" size="sm" onClick={() => setOpen(false)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogPopup;