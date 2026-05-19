interface AvatarProps {
  username: string;
  avatar?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ username, avatar, size = 48, className = '' }: AvatarProps) {
  const sizeStyle = { width: size, height: size, minWidth: size };

  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-border bg-surface text-sm font-semibold text-text ${className}`}
      style={sizeStyle}
    >
      {avatar ? (
        <img src={avatar} alt={username} className="h-full w-full rounded-xl object-cover" />
      ) : (
        username.charAt(0).toUpperCase()
      )}
    </div>
  );
}
