interface AvatarProps {
  username: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({
  username,
  isOnline,
  size = "md",
}: AvatarProps) {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${sizes[size]} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold`}
      >
        {username[0].toUpperCase()}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${isOnline ? "bg-green-400" : "bg-slate-500"}`}
        />
      )}
    </div>
  );
}
