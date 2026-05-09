"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  BringToFront,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Layers3,
  SendToBack,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  CanvasObjectAlignmentAction,
  CanvasObjectOrderAction,
} from "@/features/editor/schema/canvas-mutation";
import { cn } from "@/lib/utils";

type SelectionActionBarPlacement = "top" | "bottom";

type SelectionActionBarProps = {
  left: number;
  top: number;
  placement: SelectionActionBarPlacement;
  canDuplicate: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
  canBringToFront: boolean;
  canBringForward: boolean;
  canSendBackward: boolean;
  canSendToBack: boolean;
  canAlign: boolean;
  canFlipHorizontal: boolean;
  canFlipVertical: boolean;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onOrder: (action: CanvasObjectOrderAction) => void;
  onAlign: (action: CanvasObjectAlignmentAction) => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
};

type ActionItem = {
  id: CanvasObjectOrderAction | CanvasObjectAlignmentAction;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export function CanvasSelectionActionBar({
  left,
  top,
  placement,
  canDuplicate,
  canCopy,
  canPaste,
  canDelete,
  canBringToFront,
  canBringForward,
  canSendBackward,
  canSendToBack,
  canAlign,
  canFlipHorizontal,
  canFlipVertical,
  onDuplicate,
  onCopy,
  onPaste,
  onDelete,
  onOrder,
  onAlign,
  onFlipHorizontal,
  onFlipVertical,
}: SelectionActionBarProps) {
  const [positionOpen, setPositionOpen] = useState(false);

  const orderItems = useMemo<ActionItem[]>(
    () => [
      { id: "bring-to-front", label: "To Front", icon: BringToFront, disabled: !canBringToFront },
      { id: "bring-forward", label: "Forward", icon: ArrowUpToLine, disabled: !canBringForward },
      { id: "send-backward", label: "Backward", icon: ArrowDownToLine, disabled: !canSendBackward },
      { id: "send-to-back", label: "To back", icon: SendToBack, disabled: !canSendToBack },
    ],
    [canBringForward, canBringToFront, canSendBackward, canSendToBack],
  );

  const alignItems = useMemo<ActionItem[]>(
    () => [
      { id: "align-left", label: "Align left", icon: AlignStartHorizontal, disabled: !canAlign },
      {
        id: "align-center-horizontal",
        label: "Align center",
        icon: AlignCenterHorizontal,
        disabled: !canAlign,
      },
      { id: "align-right", label: "Align right", icon: AlignEndHorizontal, disabled: !canAlign },
      { id: "align-top", label: "Align top", icon: AlignStartVertical, disabled: !canAlign },
      {
        id: "align-center-vertical",
        label: "Align middle",
        icon: AlignCenterVertical,
        disabled: !canAlign,
      },
      { id: "align-bottom", label: "Align bottom", icon: AlignEndVertical, disabled: !canAlign },
    ],
    [canAlign],
  );

  return (
    <div
      className="ef-selection-action-bar-shell"
      data-placement={placement}
      style={{ left, top }}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="ef-selection-action-bar">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ef-selection-action-bar-button !h-[30px] !w-[30px] !p-0"
          disabled={!canCopy}
          title="Copier"
          aria-label="Copier"
          onClick={(event) => {
            event.stopPropagation();
            onCopy();
          }}
        >
          <ClipboardCopy size={13} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ef-selection-action-bar-button !h-[30px] !w-[30px] !p-0"
          disabled={!canPaste}
          title="Coller"
          aria-label="Coller"
          onClick={(event) => {
            event.stopPropagation();
            onPaste();
          }}
        >
          <ClipboardPaste size={13} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ef-selection-action-bar-button !h-[30px] !w-[30px] !p-0"
          disabled={!canDuplicate}
          title="Dupliquer"
          aria-label="Dupliquer"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy size={13} strokeWidth={2} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ef-selection-action-bar-button !h-[30px] !w-[30px] !p-0"
          disabled={!canDelete}
          title="Supprimer"
          aria-label="Supprimer"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
        </Button>

        <Popover open={positionOpen} onOpenChange={setPositionOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "ef-selection-action-bar-button !h-[30px] !w-[30px] !p-0",
                positionOpen && "is-active",
              )}
              title="Position"
              aria-label="Position"
              aria-pressed={positionOpen}
              onClick={(event) => event.stopPropagation()}
            >
              <Layers3 size={13} strokeWidth={2} aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            side={placement === "top" ? "bottom" : "top"}
            sideOffset={10}
            className="ef-selection-action-popover"
            onPointerDownOutside={() => setPositionOpen(false)}
            onEscapeKeyDown={() => setPositionOpen(false)}
          >
            <div
              className="ef-selection-action-popover-shell"
              role="menu"
              aria-label="Position de l'objet"
            >
              <section className="ef-selection-action-popover-section" aria-label="Ordre">
                <div className="ef-selection-action-popover-section-title">Layering</div>
                <div className="ef-selection-action-popover-grid ef-selection-action-popover-grid--order">
                  {orderItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ef-selection-action-popover-item ef-selection-action-popover-item--order"
                        disabled={item.disabled}
                        title={item.label}
                        aria-label={item.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (item.disabled) {
                            return;
                          }

                          onOrder(item.id as CanvasObjectOrderAction);
                          setPositionOpen(false);
                        }}
                      >
                        <Icon size={13} strokeWidth={2} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>

              <section className="ef-selection-action-popover-section" aria-label="Alignement">
                <div className="ef-selection-action-popover-section-title">Position</div>
                <div className="ef-selection-action-popover-grid ef-selection-action-popover-grid--align">
                  {alignItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ef-selection-action-popover-item ef-selection-action-popover-item--align"
                        disabled={item.disabled}
                        title={item.label}
                        aria-label={item.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (item.disabled) {
                            return;
                          }

                          onAlign(item.id as CanvasObjectAlignmentAction);
                          setPositionOpen(false);
                        }}
                      >
                        <Icon size={13} strokeWidth={2} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>

              <section className="ef-selection-action-popover-section" aria-label="Retournement">
                <div className="ef-selection-action-popover-section-title">Flip</div>
                <div className="ef-selection-action-popover-grid ef-selection-action-popover-grid--flip">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ef-selection-action-popover-item ef-selection-action-popover-item--flip"
                    disabled={!canFlipHorizontal}
                    title="Flip Horizontal"
                    aria-label="Flip Horizontal"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!canFlipHorizontal) {
                        return;
                      }

                      onFlipHorizontal();
                      setPositionOpen(false);
                    }}
                  >
                    <FlipHorizontal size={13} strokeWidth={2} aria-hidden="true" />
                    <span>Flip Horizontal</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ef-selection-action-popover-item ef-selection-action-popover-item--flip"
                    disabled={!canFlipVertical}
                    title="Flip Vertical"
                    aria-label="Flip Vertical"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!canFlipVertical) {
                        return;
                      }

                      onFlipVertical();
                      setPositionOpen(false);
                    }}
                  >
                    <FlipVertical size={13} strokeWidth={2} aria-hidden="true" />
                    <span>Flip Vertical</span>
                  </Button>
                </div>
              </section>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
