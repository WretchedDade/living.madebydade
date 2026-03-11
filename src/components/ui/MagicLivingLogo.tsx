import { Wand2Icon } from "lucide-react";

interface LogoProps {
	className?: string;
	size?: number;
}

export function MagicLivingLogo({ className = "", size = 32 }: LogoProps) {
	return <Wand2Icon width={size} height={size} className={className} />;
}
