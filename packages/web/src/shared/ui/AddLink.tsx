interface AddLinkProps {
  onClick: () => void;
  label: string;
}

export function AddLink({ onClick, label }: AddLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-(--color-accent) hover:underline font-medium focus:outline-none focus-visible:underline"
    >
      {label}
    </button>
  );
}
