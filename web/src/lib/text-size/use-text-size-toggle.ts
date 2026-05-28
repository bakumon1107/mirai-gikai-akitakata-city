"use client";

import { useEffect, useState } from "react";
import {
  getTextSizeLargeFromStorage,
  setTextSizeLargeToStorage,
} from "./storage";

export function useTextSizeToggle() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    setIsLarge(getTextSizeLargeFromStorage());
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsLarge(checked);
    setTextSizeLargeToStorage(checked);
    if (checked) {
      document.documentElement.classList.add("large-text");
    } else {
      document.documentElement.classList.remove("large-text");
    }
  };

  return { isLarge, handleToggle };
}
