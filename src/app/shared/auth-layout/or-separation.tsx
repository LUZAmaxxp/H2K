import cn from "@core/utils/class-names";

export default function OrSeparation({
  title,
  isCenter,
  className,
}: {
  title: string;
  isCenter?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative my-6",
        isCenter && "text-center",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 text-gray-500">{title}</span>
      </div>
    </div>
  );
}
