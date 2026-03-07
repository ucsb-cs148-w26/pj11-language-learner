type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: string;        // Tailwind size classes for container, e.g. "w-10 h-10"
  iconSize?: string;    // Tailwind size classes for the SVG icon, e.g. "w-5 h-5"
  imgClassName?: string; // extra classes applied only to <img> (e.g. border)
  className?: string;   // extra classes applied only to the fallback <div>
};

export default function Avatar({
  src,
  alt = "",
  size = "w-10 h-10",
  iconSize = "w-5 h-5",
  imgClassName = "",
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${size} rounded-full object-cover ${imgClassName}`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-off-white border border-gray-border-soft flex items-center justify-center text-gray-muted-2 ${className}`}
    >
      <svg
        className={iconSize}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    </div>
  );
}