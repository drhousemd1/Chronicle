

# Add Show/Hide Password Toggle to Password Fields

## Changes

### Files: `src/components/auth/AuthModal.tsx` and `src/pages/Auth.tsx`

1. Add `showPassword` and `showConfirmPassword` boolean state variables
2. Wrap each password `<input>` in a `relative` div
3. Toggle `type` between `"password"` and `"text"` based on state
4. Add an `Eye` / `EyeOff` icon button (from `lucide-react`) positioned `absolute right-3` inside the input, vertically centered
5. Icon button styled as `text-white/30 hover:text-white/50`, no background, `type="button"` to prevent form submission

Applies to both the password and confirm password fields in both files.

