# Edge Cases and UX Improvements Plan

## Overview

This plan implements several UX improvements and fixes edge cases in the StreamTrack application, including watchlist management enhancements, season availability display, and removing debug UI elements.

---

## 1. Fix Watchlist Re-add Issue (Optimistic UI Update)

**Problem**: When a user removes a show from watchlist and tries to re-add it, they get an error saying it's already in the watchlist due to stale cache.

**Solution**:

- Update `ProfilePage.tsx` - After successful removal, immediately reload the watchlist data
- Update `SearchPage.tsx` - Add optimistic update to track newly added shows in local state
- Update backend `quick-add` endpoint at `backend/src/routes/shows.ts:535-539` - Check if user_shows record exists but is soft-deleted, and restore it instead of throwing error

**Files to modify**:

- `frontend/src/components/ProfilePage.tsx` - Add `loadWatchlist()` call after successful removal (line ~60)
- `frontend/src/components/SearchPage.tsx` - Track recently added shows in state to update UI immediately
- `backend/src/routes/shows.ts` - Handle re-adding previously removed shows (lines 527-540)

---

## 2. Remove Color Palette Preview

**Problem**: Color palette preview is visible in top-right corner of landing page and should not be shown to users.

**Solution**:

- Remove the entire color palette section from `frontend/src/app/page.tsx` (lines 141-163)

**Files to modify**:

- `frontend/src/app/page.tsx` - Delete the fixed position color palette div

---

## 3. Add Status Dropdown to Watchlist Items

**Problem**: Users can only mark shows as "Complete" or remove them, but want to change status to watching/plan_to_watch/dropped.

**Solution**:

- Use existing `Select` component from `frontend/src/components/ui/select.tsx`
- Update `ProfilePage.tsx` to replace "Mark Complete" button with a status dropdown
- Dropdown options: Watching, Completed, Plan to Watch, Dropped
- Call `watchlistService.updateShowStatus()` when status changes

**Implementation in ProfilePage.tsx**:

```typescript
// Replace the "Mark Complete" button (lines 243-254) with:
<Select
  value={item.watch_status}
  onValueChange={(newStatus) => handleStatusUpdate(item.show_id, newStatus)}
  disabled={updatingStatus === item.show_id}
>
  <SelectTrigger className="w-36 h-8">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="watching">Watching</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
    <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
    <SelectItem value="dropped">Dropped</SelectItem>
  </SelectContent>
</Select>
```

**Files to modify**:

- `frontend/src/components/ProfilePage.tsx`:
  - Import Select, SelectTrigger, SelectValue, SelectContent, SelectItem
  - Replace "Mark Complete" button with Select dropdown
  - Update `handleStatusUpdate()` to accept any status value

---

## 4. Add Season Availability Modal

**Problem**: Shows have season-by-season streaming platform data but it's not displayed to users.

**Solution**:

- Create new `ShowDetailsModal.tsx` component using existing `Dialog` from `frontend/src/components/ui/dialog.tsx`
- Display in modal:
  - Show poster, title, overview, rating
  - Season-by-season breakdown with streaming platforms for each season
  - Overall streaming platforms
- Update `SearchPage.tsx`:
  - Add platform badges to bottom right of each show card (max 3 visible)
  - Make cards clickable to open modal
  - Pass `show.seasonAvailability` data to modal

**ShowDetailsModal Component Structure**:

```typescript
// frontend/src/components/ShowDetailsModal.tsx
interface ShowDetailsModalProps {
  show: Show | null;
  isOpen: boolean;
  onClose: () => void;
}

// Modal contents:
// - Header: Show title, rating, year
// - Poster and overview
// - "Overall Availability" section with all platforms
// - "Season Availability" section:
//   - List each season
//   - Show platforms for that season
//   - Show availability type (subscription, free, ads, rent, buy)
// - "Add to Watchlist" button (if not already added)
```

**SearchPage Card Updates**:

```typescript
// Add to show card (bottom right corner, before the Add to Watchlist button):
{show.providers && show.providers.length > 0 && (
  <div className="flex gap-1 flex-wrap justify-end mt-2">
    {show.providers.slice(0, 3).map((provider, idx) => (
      <Badge key={idx} variant="outline" className="text-xs">
        {provider.provider_name}
      </Badge>
    ))}
    {show.providers.length > 3 && (
      <Badge variant="outline" className="text-xs">
        +{show.providers.length - 3}
      </Badge>
    )}
  </div>
)}

// Make card clickable (wrap CardContent):
<Card 
  className="cursor-pointer hover:shadow-lg transition-shadow"
  onClick={() => setSelectedShow(show)}
>
```

**Files to create**:

- `frontend/src/components/ShowDetailsModal.tsx` - New modal component

**Files to modify**:

- `frontend/src/components/SearchPage.tsx`:
  - Add state for selected show: `const [selectedShow, setSelectedShow] = useState<Show | null>(null)`
  - Add platform badges to show card (bottom right)
  - Add onClick handler to card to set selected show
  - Integrate ShowDetailsModal component
- `frontend/src/services/showService.ts` - Ensure seasonAvailability is properly typed

---

## 5. Edge Case Testing & Error Handling

**Edge Cases to Handle**:

### Watchlist Management

- Add show → Remove show → Re-add same show (should work immediately)
- Add show while offline → Show appropriate error toast
- Change status while another status update is in progress → Disable dropdown with loading state
- Remove show with network failure → Rollback and show error toast

### Search and Season Availability

- Click show with no season data → Modal shows "No season availability information"
- Click show with season data → Modal displays all seasons with platforms
- Search with no results → Display empty state message
- Search while previous search is loading → Show loading state

### Status Dropdown

- Change status from Watching → Completed → Verify badge and list updates
- Change status with network error → Show error toast, keep previous status
- Change status on last item in category → Verify list reorganizes correctly

### Authentication Edge Cases

- Try to add to watchlist while not logged in → Redirect to /auth with toast
- Try to change status without auth → Show error toast

### UI/UX Edge Cases

- Very long show title → Truncate with ellipsis in card and show full in modal
- Show with no poster image → Display placeholder image
- Show with 10+ seasons → Modal should scroll properly
- Rapid clicking on "Add to Watchlist" → Disable button during request
- Show with no providers → Display "Not available on tracked platforms"

**Error Handling Patterns**:

1. Network errors → Toast with error message
2. Validation errors → Inline error messages
3. Concurrent operations → Disable UI elements, show loading spinners
4. Stale data → Auto-refresh after mutations
5. Missing data → Graceful fallbacks with "N/A" or placeholders

---

## Implementation Checklist

- [ ] Fix watchlist re-add caching issue
- [ ] Remove color palette from landing page
- [ ] Add status dropdown to ProfilePage
- [ ] Create ShowDetailsModal component
- [ ] Add platform badges to search results
- [ ] Integrate modal with SearchPage
- [ ] Test add/remove/re-add flow
- [ ] Test status dropdown updates
- [ ] Test season availability modal
- [ ] Test all edge cases with proper error handling
- [ ] Verify loading states prevent duplicate requests
- [ ] Verify offline behavior shows appropriate errors
- [ ] Verify long text and missing images handled properly

---

## Notes

This plan builds on the existing backend-frontend integration and focuses on polish and edge case handling to create a production-ready user experience.
