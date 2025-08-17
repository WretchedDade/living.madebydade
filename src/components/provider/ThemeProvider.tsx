import React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeProviderProps = {
	children: React.ReactNode;
	storageKey: string;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	React.useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("light");
		root.classList.add("dark");
	}, []);
	return <>{children}</>;
}
