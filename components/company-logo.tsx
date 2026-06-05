import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  className?: string;
  imageClassName?: string;
  compact?: boolean;
};

export function CompanyLogo({ className, imageClassName, compact = false }: CompanyLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/logo.jpeg"
        alt="AGRICOLA PIMAMPIRO"
        className={cn("h-14 w-auto object-contain", compact && "h-10", imageClassName)}
      />
    </div>
  );
}
