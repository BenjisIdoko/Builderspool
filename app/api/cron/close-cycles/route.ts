// Kept so the existing schedule in vercel.json keeps working: closing cycles is
// now one stage of the cycle tick (see ../cycle-tick/route.ts).
export { GET, POST } from '../cycle-tick/route';
export const dynamic = 'force-dynamic';
