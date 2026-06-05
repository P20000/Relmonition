# Relmonition Function Complexity Analysis

This document details the approximate worst-case time and space complexity for all functions across the Relmonition frontend and backend codebase, derived using heuristic AST analysis.

| File | Function Name | Time Complexity | Space Complexity | Reasoning |
|---|---|---|---|---|
| `accordion.tsx` | `Accordion` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `accordion.tsx` | `AccordionContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `accordion.tsx` | `AccordionItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `accordion.tsx` | `AccordionTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `ai-config-controller.ts` | `activateAIConfig` | O(N) (DB) | O(1) | Database query detected |
| `ai-config-controller.ts` | `createAIConfig` | O(1) | O(1) | Straightforward execution |
| `ai-config-controller.ts` | `deleteAIConfig` | O(N) (DB) | O(1) | Database query detected |
| `ai-config-controller.ts` | `getAIConfigs` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `ai-utils.ts` | `callWithRetry` | O(N) | O(1) | Single loop or array iteration method detected |
| `AICoach.tsx` | `AICoach` | O(N^2) | O(N) | Nested loops detected, allocates new arrays |
| `AICoach.tsx` | `executeUpload` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `handleDeleteContext` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `handleDeleteConversation` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `handleEdit` | O(N) (DB) | O(N) | Database query detected, allocates new arrays |
| `AICoach.tsx` | `handleFileSelection` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `handleRegenerate` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `handleSend` | O(1) | O(N) | Allocates new arrays |
| `AICoach.tsx` | `handleStop` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `loadContextUploads` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `loadConversations` | O(1) | O(1) | Straightforward execution |
| `AICoach.tsx` | `loadMessages` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `AICoach.tsx` | `processStream` | O(N^2) | O(N) | Nested loops detected, allocates new arrays |
| `AICoach.tsx` | `startNewConversation` | O(1) | O(N) | Allocates new arrays |
| `AICoach.tsx` | `ThinkingIndicator` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `AIKeyManager.tsx` | `AIKeyManager` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `AIKeyManager.tsx` | `handleActivate` | O(1) | O(1) | Straightforward execution |
| `AIKeyManager.tsx` | `handleCreate` | O(1) | O(1) | Straightforward execution |
| `AIKeyManager.tsx` | `handleDelete` | O(1) | O(1) | Straightforward execution |
| `AIKeyManager.tsx` | `loadConfigs` | O(1) | O(1) | Straightforward execution |
| `alert-dialog.tsx` | `AlertDialog` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogAction` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogCancel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogOverlay` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert-dialog.tsx` | `AlertDialogTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert.tsx` | `Alert` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert.tsx` | `AlertDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alert.tsx` | `AlertTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `alter-db.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `api-client.ts` | `activateAIConfig` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `createAIConfig` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `createJournalEntry` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `delete` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `deleteAccount` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `deleteAIConfig` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `get` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `getAIConfigs` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `getJournalEntries` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `getJournalPrompt` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `getMe` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `getTenantData` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `handleResponse` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `login` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `logout` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `patch` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `post` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `put` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `queryRelationshipContext` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `signup` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `toString` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `updateProfile` | O(1) | O(1) | Straightforward execution |
| `api-client.ts` | `uploadChatHistory` | O(1) | O(1) | Straightforward execution |
| `aspect-ratio.tsx` | `AspectRatio` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `audit.test.ts` | `getGlobalClient` | O(1) | O(1) | Straightforward execution |
| `audit.ts` | `auditLogger` | O(1) | O(N) | Allocates new arrays |
| `auth-controller.ts` | `deleteAccount` | O(1) | O(1) | Straightforward execution |
| `auth-controller.ts` | `getMe` | O(N) (DB) | O(1) | Database query detected |
| `auth-controller.ts` | `login` | O(N) (DB) | O(1) | Database query detected |
| `auth-controller.ts` | `logout` | O(N) (DB) | O(1) | Database query detected |
| `auth-controller.ts` | `signup` | O(1) | O(1) | Straightforward execution |
| `auth-controller.ts` | `updateProfile` | O(N) (DB) | O(1) | Database query detected |
| `auth.test.ts` | `getGlobalClient` | O(1) | O(1) | Straightforward execution |
| `auth.ts` | `authenticate` | O(N) (DB) | O(1) | Database query detected |
| `auth.ts` | `optionalAuth` | O(N) (DB) | O(1) | Database query detected |
| `AuthContext.tsx` | `AuthProvider` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `AuthContext.tsx` | `login` | O(1) | O(1) | Straightforward execution |
| `AuthContext.tsx` | `logout` | O(1) | O(1) | Straightforward execution |
| `AuthContext.tsx` | `setActiveTenantId` | O(1) | O(1) | Straightforward execution |
| `AuthContext.tsx` | `setName` | O(1) | O(1) | Straightforward execution |
| `AuthContext.tsx` | `useAuth` | O(1) | O(1) | Straightforward execution |
| `authorize.test.ts` | `getGlobalClient` | O(1) | O(N) | Allocates new arrays |
| `authorize.ts` | `authorize` | O(N) (DB) | O(1) | Database query detected |
| `AuthPage.tsx` | `AuthPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `AuthPage.tsx` | `handleSubmit` | O(1) | O(1) | Straightforward execution |
| `avatar.tsx` | `Avatar` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `avatar.tsx` | `AvatarFallback` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `avatar.tsx` | `AvatarImage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `backfill-journal-dates.ts` | `backfill` | O(N) | O(1) | Single loop or array iteration method detected |
| `backfill-metrics.ts` | `backfillAllTenants` | O(N) | O(1) | Single loop or array iteration method detected |
| `backfill-metrics.ts` | `backfillTenantMetrics` | O(N) | O(1) | Single loop or array iteration method detected |
| `badge.tsx` | `Badge` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `Breadcrumb` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbEllipsis` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbLink` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbList` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `breadcrumb.tsx` | `BreadcrumbSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `button.tsx` | `Button` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `calendar.tsx` | `Calendar` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `Card` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardAction` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `card.tsx` | `CardTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `Carousel` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `CarouselContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `CarouselItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `CarouselNext` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `CarouselPrevious` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `carousel.tsx` | `useCarousel` | O(1) | O(1) | Straightforward execution |
| `chart.tsx` | `ChartContainer` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `chart.tsx` | `ChartLegendContent` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `chart.tsx` | `ChartStyle` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `chart.tsx` | `ChartTooltipContent` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `chart.tsx` | `getPayloadConfigFromPayload` | O(1) | O(1) | Straightforward execution |
| `chart.tsx` | `useChart` | O(1) | O(1) | Straightforward execution |
| `check_data_metrics.ts` | `checkData` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `check-dangling.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `checkbox.tsx` | `Checkbox` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `coach-controller.test.ts` | `getDatabaseClient` | O(1) | O(1) | Straightforward execution |
| `coach-controller.ts` | `deleteContextUpload` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `deleteConversation` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `editLatestPrompt` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `getConversations` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `getMessages` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `getUploadStatus` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `coach-controller.ts` | `regenerateResponse` | O(N) (DB) | O(1) | Database query detected |
| `coach-controller.ts` | `streamChat` | O(N) | O(1) | Single loop or array iteration method detected |
| `coach-controller.ts` | `uploadChatHistory` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `coach-controller.ts` | `validateSession` | O(N) (DB) | O(1) | Database query detected |
| `collapsible.tsx` | `Collapsible` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `collapsible.tsx` | `CollapsibleContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `collapsible.tsx` | `CollapsibleTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `Command` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandDialog` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandEmpty` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandInput` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandList` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `command.tsx` | `CommandShortcut` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenu` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuCheckboxItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuRadioGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuRadioItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuShortcut` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuSub` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuSubContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuSubTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `context-menu.tsx` | `ContextMenuTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `cookie-config.ts` | `getAuthCookieConfig` | O(1) | O(1) | Straightforward execution |
| `crypto.ts` | `decrypt` | O(1) | O(1) | Straightforward execution |
| `crypto.ts` | `encrypt` | O(1) | O(1) | Straightforward execution |
| `crypto.ts` | `getMasterKey` | O(1) | O(1) | Straightforward execution |
| `dashboard-calculator.ts` | `calculateEMA` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `dashboard-calculator.ts` | `calculateGottmanRatio` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `dashboard-calculator.ts` | `calculateHealthScore` | O(1) | O(1) | Straightforward execution |
| `dashboard-calculator.ts` | `calculateInteractionScore` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `dashboard-calculator.ts` | `calculateTrend` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Dashboard.tsx` | `BestMomentsCard` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Dashboard.tsx` | `Dashboard` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Dashboard.tsx` | `fetchDashboardData` | O(1) | O(N) | Allocates new arrays |
| `Dashboard.tsx` | `GottmanEmptyState` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `Dashboard.tsx` | `GottmanRatioCard` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `Dashboard.tsx` | `ImprovementsRequiredCard` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Dashboard.tsx` | `Skeleton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `debug-tenants.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `deletion-orchestrator.ts` | `deleteUserAccount` | O(N^2) | O(1) | Nested loops detected |
| `dialog.tsx` | `Dialog` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogClose` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogOverlay` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dialog.tsx` | `DialogTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `Drawer` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerClose` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerOverlay` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `drawer.tsx` | `DrawerTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenu` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuCheckboxItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuRadioGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuRadioItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuShortcut` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuSub` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuSubContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuSubTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dropdown-menu.tsx` | `DropdownMenuTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `dump-db.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `embeddings-service.ts` | `batchEmbedTexts` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `embeddings-service.ts` | `cosineSimilarity` | O(N) | O(1) | Single loop or array iteration method detected |
| `embeddings-service.ts` | `embedText` | O(1) | O(1) | Straightforward execution |
| `embeddings-service.ts` | `getGeminiClient` | O(1) | O(1) | Straightforward execution |
| `factory.ts` | `clearProviderCache` | O(1) | O(1) | Straightforward execution |
| `factory.ts` | `getLLMProvider` | O(N) (DB) | O(1) | Database query detected |
| `form.tsx` | `FormControl` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `FormDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `FormField` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `FormItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `FormLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `FormMessage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `form.tsx` | `useFormField` | O(1) | O(1) | Straightforward execution |
| `gemini-provider.ts` | `generateStream` | O(N) | O(1) | Single loop or array iteration method detected |
| `gemini-provider.ts` | `generateText` | O(1) | O(1) | Straightforward execution |
| `greeting-service.ts` | `generateDynamicGreeting` | O(1) | O(1) | Straightforward execution |
| `hover-card.tsx` | `HoverCard` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `hover-card.tsx` | `HoverCardContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `hover-card.tsx` | `HoverCardTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `http-metrics.ts` | `httpMetricsMiddleware` | O(1) | O(1) | Straightforward execution |
| `http-metrics.ts` | `normalizeRoute` | O(1) | O(1) | Straightforward execution |
| `ImageWithFallback.tsx` | `handleError` | O(1) | O(1) | Straightforward execution |
| `ImageWithFallback.tsx` | `ImageWithFallback` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `input-otp.tsx` | `InputOTP` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `input-otp.tsx` | `InputOTPGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `input-otp.tsx` | `InputOTPSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `input-otp.tsx` | `InputOTPSlot` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `input.tsx` | `Input` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `journal-controller.ts` | `createEntry` | O(N) (DB) | O(1) | Database query detected |
| `journal-controller.ts` | `getDailyPrompt` | O(N) (DB) | O(1) | Database query detected |
| `journal-controller.ts` | `getDb` | O(1) | O(1) | Straightforward execution |
| `journal-controller.ts` | `getEntries` | O(N) (DB) | O(1) | Database query detected |
| `Journal.tsx` | `fetchInitialData` | O(1) | O(N) | Allocates new arrays |
| `Journal.tsx` | `formatDate` | O(1) | O(1) | Straightforward execution |
| `Journal.tsx` | `getDaysInMonth` | O(1) | O(1) | Straightforward execution |
| `Journal.tsx` | `getLocalDateString` | O(1) | O(1) | Straightforward execution |
| `Journal.tsx` | `handleSubmit` | O(1) | O(1) | Straightforward execution |
| `Journal.tsx` | `Journal` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Journal.tsx` | `nextMonth` | O(1) | O(1) | Straightforward execution |
| `Journal.tsx` | `prevMonth` | O(1) | O(1) | Straightforward execution |
| `label.tsx` | `Label` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `layout.tsx` | `handleNavigate` | O(1) | O(1) | Straightforward execution |
| `layout.tsx` | `ProtectedLayout` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `layout.tsx` | `RootLayout` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `LogoIcon.tsx` | `LogoIcon` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `Menubar` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarCheckboxItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarMenu` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarRadioGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarRadioItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarShortcut` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarSub` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarSubContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarSubTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `menubar.tsx` | `MenubarTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `metrics-service.ts` | `analyzeBehavioralMetrics` | O(1) | O(1) | Straightforward execution |
| `metrics-service.ts` | `analyzeHistoricalWeek` | O(1) | O(1) | Straightforward execution |
| `metrics-service.ts` | `analyzeHistoryFromChat` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `metrics-service.ts` | `extractWeeklyWindows` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `metrics-service.ts` | `processJournalMetrics` | O(N) (DB) | O(1) | Database query detected |
| `metrics-service.ts` | `updateInteractionMetrics` | O(N) (DB) | O(1) | Database query detected |
| `metrics-service.ts` | `updateRelationshipInsight` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `metrics.ts` | `startMetricsServer` | O(1) | O(1) | Straightforward execution |
| `migrate-embeddings.ts` | `run` | O(N) | O(1) | Single loop or array iteration method detected |
| `navigation-menu.tsx` | `NavigationMenu` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuIndicator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuLink` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuList` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `navigation-menu.tsx` | `NavigationMenuViewport` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `Navigation.tsx` | `Navigation` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `openai-provider.ts` | `generateStream` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `openai-provider.ts` | `generateText` | O(1) | O(N) | Allocates new arrays |
| `page.tsx` | `AICoachPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `page.tsx` | `DashboardPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `page.tsx` | `handleLogout` | O(1) | O(1) | Straightforward execution |
| `page.tsx` | `handleTenantChange` | O(1) | O(1) | Straightforward execution |
| `page.tsx` | `Home` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `page.tsx` | `JournalPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `page.tsx` | `PersonalityPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `page.tsx` | `SettingsPage` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `Pagination` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationEllipsis` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationLink` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationNext` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `pagination.tsx` | `PaginationPrevious` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `Personality.tsx` | `handleAddPreference` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Personality.tsx` | `handleGenerate` | O(1) | O(1) | Straightforward execution |
| `Personality.tsx` | `handleRemovePreference` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Personality.tsx` | `loadData` | O(1) | O(N) | Allocates new arrays |
| `Personality.tsx` | `Personality` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `popover.tsx` | `Popover` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `popover.tsx` | `PopoverAnchor` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `popover.tsx` | `PopoverContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `popover.tsx` | `PopoverTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `profile-controller.ts` | `getProfiles` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `profile-controller.ts` | `safeParse` | O(1) | O(N) | Allocates new arrays |
| `profile-controller.ts` | `triggerProfileGeneration` | O(1) | O(1) | Straightforward execution |
| `profile-controller.ts` | `updateLikesDislikes` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `profile-service.ts` | `checkAndSyncProfiles` | O(N) (DB) | O(1) | Database query detected |
| `profile-service.ts` | `generatePersonalityProfiles` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `progress.tsx` | `Progress` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `query-members.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `query-tenants.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `radio-group.tsx` | `RadioGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `radio-group.tsx` | `RadioGroupItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `rag-controller.ts` | `ragEmbed` | O(1) | O(1) | Straightforward execution |
| `rag-controller.ts` | `ragQuery` | O(1) | O(1) | Straightforward execution |
| `rag-service.ts` | `backfillHistoryFromExistingUploads` | O(N) | O(1) | Single loop or array iteration method detected |
| `rag-service.ts` | `embedAndStoreJournalEntry` | O(1) | O(1) | Straightforward execution |
| `rag-service.ts` | `processChatUpload` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `rag-service.ts` | `queryRelationshipMemory` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `rag-service.ts` | `queryRelationshipMemoryStream` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `rate-limiter.ts` | `rateLimiter` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `copyConnectionCode` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `handleCreateTenant` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `handleDelete` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `handleJoinTenant` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `handleLeave` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `handleRegenerateCode` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `loadTenants` | O(1) | O(1) | Straightforward execution |
| `RelationshipManager.tsx` | `RelationshipManager` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `resizable.tsx` | `ResizableHandle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `resizable.tsx` | `ResizablePanel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `resizable.tsx` | `ResizablePanelGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `retrieval-engine.ts` | `retrieveContext` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `scroll-area.tsx` | `ScrollArea` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `scroll-area.tsx` | `ScrollBar` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `security-check.ts` | `checkDependencies` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `security-check.ts` | `checkPromptSafety` | O(N) | O(1) | Single loop or array iteration method detected |
| `security-check.ts` | `checkRouteMiddleware` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `security-check.ts` | `checkSQLInjection` | O(N^2) | O(1) | Nested loops detected |
| `security-check.ts` | `getFiles` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays, call stack space |
| `security-check.ts` | `printHeader` | O(1) | O(1) | Straightforward execution |
| `security-check.ts` | `runPipeline` | O(1) | O(1) | Straightforward execution |
| `security-check.ts` | `runSecurityTests` | O(1) | O(1) | Straightforward execution |
| `security.test.ts` | `getDatabaseClient` | O(1) | O(1) | Straightforward execution |
| `security.test.ts` | `getGlobalClient` | O(1) | O(1) | Straightforward execution |
| `seed.ts` | `daysAgo` | O(1) | O(1) | Straightforward execution |
| `seed.ts` | `seed` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `seed.ts` | `uuid` | O(1) | O(1) | Straightforward execution |
| `select.tsx` | `Select` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectScrollDownButton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectScrollUpButton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `select.tsx` | `SelectValue` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `separator.tsx` | `Separator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `Settings.tsx` | `handleDeleteAccount` | O(N) | O(1) | Single loop or array iteration method detected |
| `Settings.tsx` | `handleSaveName` | O(1) | O(1) | Straightforward execution |
| `Settings.tsx` | `loadPreferences` | O(N) (DB) | O(N) | Database query detected, allocates new arrays |
| `Settings.tsx` | `loadUploadHistory` | O(1) | O(1) | Straightforward execution |
| `Settings.tsx` | `Settings` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `Settings.tsx` | `updatePreference` | O(N) (DB) | O(N) | Database query detected, allocates new arrays |
| `sheet.tsx` | `Sheet` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetClose` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetDescription` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetOverlay` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetPortal` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetTitle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sheet.tsx` | `SheetTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `handleKeyDown` | O(1) | O(1) | Straightforward execution |
| `sidebar.tsx` | `Sidebar` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarGroupAction` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarGroupContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarGroupLabel` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarInput` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarInset` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenu` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuAction` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuBadge` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuButton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuSkeleton` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuSub` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuSubButton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarMenuSubItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarProvider` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarRail` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarSeparator` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `SidebarTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `sidebar.tsx` | `useSidebar` | O(1) | O(1) | Straightforward execution |
| `skeleton.tsx` | `Skeleton` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `slider.tsx` | `Slider` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `sonner.tsx` | `Toaster` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `switch.tsx` | `Switch` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `Table` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableBody` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableCaption` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableCell` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableFooter` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableHead` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableHeader` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `table.tsx` | `TableRow` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tabs.tsx` | `Tabs` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tabs.tsx` | `TabsContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tabs.tsx` | `TabsList` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tabs.tsx` | `TabsTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tenant-controller.test.ts` | `getGlobalClient` | O(1) | O(1) | Straightforward execution |
| `tenant-controller.ts` | `createTenant` | O(1) | O(1) | Straightforward execution |
| `tenant-controller.ts` | `deleteTenant` | O(N) (DB) | O(1) | Database query detected |
| `tenant-controller.ts` | `generateConnectionCode` | O(1) | O(1) | Straightforward execution |
| `tenant-controller.ts` | `getDashboardData` | O(N) (DB) | O(N) | Database query detected, allocates new arrays |
| `tenant-controller.ts` | `getDb` | O(1) | O(1) | Straightforward execution |
| `tenant-controller.ts` | `getTenantData` | O(1) | O(1) | Straightforward execution |
| `tenant-controller.ts` | `getUserTenants` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `tenant-controller.ts` | `joinTenant` | O(N) (DB) | O(1) | Database query detected |
| `tenant-controller.ts` | `leaveTenant` | O(N) (DB) | O(1) | Database query detected |
| `tenant-controller.ts` | `regenerateConnectionCode` | O(N) (DB) | O(1) | Database query detected |
| `tenant-manager.ts` | `deleteTursoDatabase` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `tenant-manager.ts` | `executeRightToBeForgotten` | O(1) | O(N) | Allocates new arrays |
| `tenant-manager.ts` | `getDatabaseClient` | O(N) (DB) | O(1) | Database query detected |
| `tenant-manager.ts` | `getGlobalClient` | O(1) | O(1) | Straightforward execution |
| `test-db.ts` | `main` | O(N) (DB) | O(1) | Database query detected |
| `textarea.tsx` | `Textarea` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `ThemeToggle.tsx` | `ThemeToggle` | O(1) / O(V) | O(N) | React Component rendering (V = Virtual DOM size) |
| `ThemeToggle.tsx` | `toggleTheme` | O(1) | O(1) | Straightforward execution |
| `toggle-group.tsx` | `ToggleGroup` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `toggle-group.tsx` | `ToggleGroupItem` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `toggle.tsx` | `Toggle` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tooltip.tsx` | `Tooltip` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tooltip.tsx` | `TooltipContent` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tooltip.tsx` | `TooltipProvider` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `tooltip.tsx` | `TooltipTrigger` | O(1) / O(V) | O(1) | React Component rendering (V = Virtual DOM size) |
| `trigger-backfill.ts` | `run` | O(1) | O(1) | Straightforward execution |
| `trigger-global-backfill.ts` | `run` | O(1) | O(1) | Straightforward execution |
| `use-mobile.ts` | `onChange` | O(1) | O(1) | Straightforward execution |
| `use-mobile.ts` | `useIsMobile` | O(1) | O(N) | Allocates new arrays |
| `utils.ts` | `cn` | O(1) | O(1) | Straightforward execution |
| `validation.ts` | `validateBody` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |
| `wipe.ts` | `wipeDatabase` | O(N) | O(N) | Single loop or array iteration method detected, allocates new arrays |