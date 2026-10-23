import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
  xl: "size-20 text-xl",
  "2xl": "size-24 text-3xl",
};

/** Photo when there is one, otherwise the first two characters of the name. */
export function CustomerAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <Avatar className={cn(sizes[size], "ring-1 ring-border", className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} className="object-cover" />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary uppercase">
        {name.trim().slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}
