# Address Location Components Usage Guide

## Components Available

### 1. **AddressAutocomplete** (Original - Simple dropdown)
Located: `src/components/address-autocomplete.tsx`
- Simple text input with autocomplete suggestions
- "Use Current Location" button
- No map display
- Lightweight and fast

### 2. **AddressMapPicker** (NEW - With embedded Google Map)
Located: `src/components/address-map-picker.tsx`
- All features of AddressAutocomplete
- **Embedded Google Map** showing selected location
- Click anywhere on map to set location
- Drag the marker to fine-tune position
- Real-time reverse geocoding (coordinates → address)
- Visual confirmation of exact location

## How to Use AddressMapPicker

### Basic Usage (Replace existing AddressAutocomplete):

```tsx
import AddressMapPicker from '@/components/address-map-picker'

// In your component:
<AddressMapPicker
  value={form.address}
  onChange={(val) => setForm({ ...form, address: val })}
  onAddressSelect={(address) => {
    setForm({
      ...form,
      address: address.display_name,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      location_lat: address.lat,
      location_lng: address.lng,
    })
  }}
  placeholder="Enter address or drop a pin on the map"
  required
  showMap={true}
  mapHeight="400px"
/>
```

### Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | required | Current address value |
| `onChange` | function | required | Called when address changes |
| `onAddressSelect` | function | optional | Called when complete address is selected |
| `placeholder` | string | "Enter address..." | Input placeholder text |
| `required` | boolean | false | Make field required |
| `className` | string | "" | Additional CSS classes |
| `showMap` | boolean | true | Show/hide the map |
| `mapHeight` | string | "400px" | Height of the map |

## Features of AddressMapPicker:

✅ **Type to search** - Auto-complete suggestions as you type
✅ **Click map** - Click anywhere on the map to set location
✅ **Drag marker** - Fine-tune exact position by dragging the pin
✅ **Current location** - GPS button to use device location
✅ **Reverse geocoding** - Automatically gets address from map clicks
✅ **Visual confirmation** - See exactly where the service location is
✅ **Clear button** - Easy reset of selected location

## Example: Update Customer Request Form

File: `src/app/customer/requests/new/page.tsx`

```tsx
// Replace this import:
import AddressAutocomplete from '@/components/address-autocomplete'

// With this:
import AddressMapPicker from '@/components/address-map-picker'

// Then replace the component usage (around line 195):
<AddressMapPicker
  value={form.address}
  onChange={(val) => setForm({ ...form, address: val })}
  onAddressSelect={(address) => {
    setForm({
      ...form,
      address: address.display_name,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      location_lat: address.lat,
      location_lng: address.lng,
    })
  }}
  placeholder="Enter address or drop a pin on the map"
  required
  showMap={true}
  mapHeight="350px"
/>
```

## Example: Helper Profile Location

```tsx
<AddressMapPicker
  value={helperAddress}
  onChange={setHelperAddress}
  onAddressSelect={(address) => {
    updateHelperProfile({
      address: address.display_name,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      latitude: address.lat,
      longitude: address.lng,
    })
  }}
  showMap={true}
  mapHeight="300px"
/>
```

## Without Map (Use Original Component)

If you want to keep it simple without the map:

```tsx
import AddressAutocomplete from '@/components/address-autocomplete'

// Or use AddressMapPicker with showMap={false}
<AddressMapPicker
  value={form.address}
  onChange={(val) => setForm({ ...form, address: val })}
  onAddressSelect={handleAddressSelect}
  showMap={false}  // No map displayed
/>
```

## API Endpoints Created:

1. **Search Address**: `/api/address/search?q=query` (already exists)
2. **Reverse Geocode**: `/api/address/reverse?lat=28.6&lng=77.2` (NEW)

## Configuration:

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDy1EjxYOwKcUFg1OnYMdJ7hcr-nhV9zoA
```

✅ Already configured in your project!

## Benefits:

1. **Better UX** - Users can see exactly where they're placing a service request
2. **More accurate** - Visual confirmation prevents wrong addresses
3. **Easier for users** - Can click map instead of typing full address
4. **Mobile friendly** - Touch to drop pin
5. **Flexible** - Can still type address if preferred

## Installation:

✅ Already installed! The package `@react-google-maps/api` has been added.

## Next Steps:

1. Replace `AddressAutocomplete` with `AddressMapPicker` in your forms
2. Test the map functionality
3. Customize map height and appearance as needed
