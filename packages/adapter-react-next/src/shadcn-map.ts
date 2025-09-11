// Initial coverage for common shadcn/ui components whose children are textual
// This list is intentionally small and easily extended.
export const SHADCN_TEXT_COMPONENTS: ReadonlySet<string> = new Set([
  // PRD-listed
  'Button',
  'Badge',
  'Label',
  'DialogTitle',
  'DialogDescription',
  'AlertDialogTitle',
  'AlertDialogDescription',
  'TooltipContent',
  'DropdownMenuItem',
  'TabsTrigger',
  'NavigationMenuLink',
  'AccordionTrigger',
  'ToastTitle',
  'ToastDescription',
  // Reasonable extras commonly used
  'AlertTitle',
  'AlertDescription',
  'CardTitle',
  'CardDescription',
  'PopoverTitle',
  'PopoverDescription',
  'Tooltip',
  'TooltipTrigger',
]);

export function isShadcnTextComponent(tagName: string): boolean {
  return SHADCN_TEXT_COMPONENTS.has(tagName);
}
