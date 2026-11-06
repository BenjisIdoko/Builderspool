import { formatNaira } from '@/lib/format';

// A naira amount for use inside monospace figures. In a monospace face the
// naira sign fills its whole cell, so its crossbars touch the first digit and
// "₦0" can read as a struck-through zero. The sign is therefore set in the text
// face and only the digits stay monospace.
export function MoneyText({ text }: { text: string }) {
  if (!text.startsWith('₦')) return <>{text}</>;
  return (
    <>
      <span className="mr-[0.08em] font-sans">₦</span>
      {text.slice(1)}
    </>
  );
}

export function Money({ amount }: { amount: number }) {
  return <MoneyText text={formatNaira(amount)} />;
}
