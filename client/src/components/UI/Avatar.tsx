interface AvatarProps {
  username: string;
  avatar?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({
  username,
  avatar,
  isOnline,
  size = "md",
}: AvatarProps) {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-16 h-16 text-xl",
  };

  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold`}
        >
          {username[0].toUpperCase()}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2`}
          style={{
            background: isOnline ? "#22c55e" : "var(--text-secondary)",
            borderColor: "var(--bg-sidebar)",
          }}
        />
      )}
    </div>
  );
}
