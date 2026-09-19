// Admin accounts are a closed system — there is deliberately no signup route
// (see app/admin/actions.ts), so every admin is created here, by someone
// with database access.
//
//   npm run create-admin -- ops@company.com "Ops Name"
//   npm run create-admin -- ops@company.com "Ops Name" --reset-password
//
// The password is read from ADMIN_PASSWORD if set, otherwise prompted for
// with input hidden. It is never accepted as a CLI argument (that would land
// in shell history) and never printed.
import { PrismaClient, Role } from '@prisma/client';
import { createInterface } from 'node:readline';
import { hashPassword } from '../lib/auth/password';

const prisma = new PrismaClient();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    process.stdout.write(question);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      // Echo newlines only, so typed characters never appear.
      if (s.includes('\n') || s.includes('\r')) write.call(rl, s);
    };
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const resetPassword = args.includes('--reset-password');
  const [emailArg, nameArg] = args.filter((a) => !a.startsWith('--'));

  if (!emailArg || !nameArg) {
    console.error('Usage: npm run create-admin -- <email> "<Full Name>" [--reset-password]');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const name = nameArg.trim();
  if (!EMAIL_RE.test(email)) {
    console.error(`"${email}" is not a valid email address.`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== Role.ADMIN) {
    console.error(`${email} already exists as a ${existing.role} account — refusing to convert it to an admin.`);
    process.exit(1);
  }
  if (existing && !resetPassword) {
    console.error(`${email} is already an admin. Re-run with --reset-password to set a new password.`);
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden(`Password for ${email} (min ${MIN_PASSWORD_LENGTH} characters): `);
    const confirm = await promptHidden('Confirm password: ');
    if (password !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Admin passwords must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    console.log(`Password updated for admin ${email}.`);
  } else {
    // emailVerifiedAt is set immediately: the person creating this account
    // is vouching for the address, and admins have no verification banner.
    await prisma.user.create({
      data: { role: Role.ADMIN, name, email, passwordHash, emailVerifiedAt: new Date() },
    });
    console.log(`Created admin ${email}. They can sign in at /admin/login.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
