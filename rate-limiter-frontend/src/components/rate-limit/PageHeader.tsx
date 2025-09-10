"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  showBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  onBack, 
  showBackButton = true 
}) => {
  return (
    <CardHeader>
      <div className="flex items-center">
        {showBackButton && (
          <Button variant="outline" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <CardTitle>{title}</CardTitle>
      </div>
    </CardHeader>
  );
};

export default PageHeader;