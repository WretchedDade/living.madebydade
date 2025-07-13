function initTheme() {
	const theme = localStorage.getItem('living-madebydade-theme-applied') || 'light';
	document.documentElement.classList.add(theme);
}

initTheme();
