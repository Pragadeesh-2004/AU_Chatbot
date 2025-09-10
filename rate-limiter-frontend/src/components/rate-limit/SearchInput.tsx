"use client";

import React from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search", 
  className = "max-w-xs mb-2" 
}) => (
  <Input 
    placeholder={placeholder} 
    value={value} 
    onChange={onChange} 
    className={className} 
  />
);

export default SearchInput;