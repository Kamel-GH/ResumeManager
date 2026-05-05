"use client";

export function promptTextValue(message: string, defaultValue = "") {
  const value = window.prompt(message, defaultValue);
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
