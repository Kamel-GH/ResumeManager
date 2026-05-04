import { SlidersHorizontal } from "lucide-react";

type ImageEditButtonProps = {
  left: number;
  top: number;
  onClick: () => void;
};

export function ImageEditButton({ left, top, onClick }: ImageEditButtonProps) {
  return (
    <button
      type="button"
      className="ef-image-edit-button"
      style={{ left, top }}
      aria-label="Éditer l’image"
      title="Éditer l’image"
      onClick={onClick}
    >
      <SlidersHorizontal size={15} aria-hidden="true" />
    </button>
  );
}

