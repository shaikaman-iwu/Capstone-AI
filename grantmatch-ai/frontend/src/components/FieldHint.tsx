type FieldHintProps = {
  error?: string;
  hint?: string;
};

export default function FieldHint({ error, hint }: FieldHintProps) {
  if (error) {
    return <p className="mt-2 text-xs font-medium text-[#a33d1f]">{error}</p>;
  }

  if (hint) {
    return <p className="mt-2 text-xs text-ink/55">{hint}</p>;
  }

  return null;
}
