import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type AppliedTheme = Exclude<Theme, 'system'>;

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey: string;
};

type ThemeProviderState = {
	theme: Theme;
	appliedTheme: AppliedTheme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: 'system',
	appliedTheme: 'light',
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, defaultTheme = 'system', storageKey, ...props }: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>('light');

	useEffect(() => {
		setTheme((localStorage.getItem(storageKey) as Theme) || defaultTheme);
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove('light', 'dark');

		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

			setAppliedTheme(systemTheme);
			root.classList.add(systemTheme);
			return;
		}

		setAppliedTheme(theme);
		root.classList.add(theme);
	}, [theme]);

	useEffect(() => {
		localStorage.setItem(`${storageKey}-applied`, appliedTheme);
	}, [appliedTheme]);

	const value = {
		theme,
		appliedTheme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
