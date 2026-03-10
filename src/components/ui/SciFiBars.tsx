// Widths safelist: w-3 w-4 w-6 w-8 w-10
import React from "react";

interface SciFiBarsProps {
	count?: number;
	className?: string;
}

const opacityClasses = [
	"bg-primary/20",
	"bg-primary/35",
	"bg-primary/50",
	"bg-primary/65",
	"bg-primary/80",
	"bg-primary/90",
	"bg-primary",
] as const;

function getBarWidths(count: number) {
	const widths = [3, 4, 6, 8, 10];
	const result: number[] = [];
	let prev: number | null = null;
	for (let i = 0; i < count; i++) {
		const choices = widths.filter(w => w !== prev);
		const w = choices[Math.floor(Math.random() * choices.length)];
		result.push(w);
		prev = w;
	}
	return result;
}

function getRandomOpacity() {
	return opacityClasses[Math.floor(Math.random() * opacityClasses.length)];
}

export const SciFiBars: React.FC<SciFiBarsProps> = ({ count = 5, className = "" }) => {
	const barWidths = getBarWidths(count);
	return (
		<div className={`flex gap-2 ${className}`}>
			{barWidths.map((w, i) => (
				<span key={i} className={`w-${w} h-2 rounded-full ${getRandomOpacity()}`} />
			))}
		</div>
	);
};
