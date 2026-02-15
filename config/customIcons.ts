
// Enter your image URLs inside the quotes.
// If left empty (""), the default system icon (Lucide) will be used.
// Recommended format: SVG or PNG with transparent background.

export const CUSTOM_ICON_PATHS: Record<string, string> = {
  // === BRANDING ===
  appLogo: "", // Location: Sidebar header, Mobile header, Home page hero. Guideline: Square, min 40x40px.

  // === NAVIGATION (Sidebar) ===
  navDashboard: "", // Location: Sidebar 'Dashboard' link. Guideline: 24x24px.
  navLearn: "", // Location: Sidebar 'Learn' link. Guideline: 24x24px.
  navVocab: "", // Location: Sidebar 'Vocabulary' link. Guideline: 24x24px.
  navKanji: "", // Location: Sidebar 'Kanji' link. Guideline: 24x24px.
  navGrammar: "", // Location: Sidebar 'Grammar' link. Guideline: 24x24px.
  navSettings: "", // Location: Sidebar 'Settings' link. Guideline: 24x24px.
  navAbout: "", // Location: Sidebar 'About' link. Guideline: 24x24px.

  // === HOME PAGE ===
  homeFolderSelect: "", // Location: Large icon in 'Select Folder' card. Guideline: 64x64px.
  homeStorageLocal: "", // Location: Sidebar footer (Local mode badge). Guideline: 18x18px.
  homeStorageBrowser: "", // Location: Browser storage button icon. Guideline: 20x20px.
  
  // === DASHBOARD ===
  dashTrophy: "", // Location: Kanji mastery card background. Guideline: Large background graphic.
  dashTrend: "", // Location: Grammar mastery card background, Activity Chart header.
  dashBook: "", // Location: Vocab mastery card background.

  // === GENERIC ACTIONS ===
  actionMenu: "", // Location: Mobile hamburger menu button. Guideline: 24x24px.
  actionClose: "", // Location: Close buttons (Mobile menu, Modals, Review controls 'Forgot').
  actionAdd: "", // Location: 'Add' buttons in list pages.
  actionEdit: "", // Location: 'Edit' pencil icon.
  actionDelete: "", // Location: 'Delete' trash can icon.
  actionSearch: "", // Location: Search bars.
  actionCheck: "", // Location: 'Mark Learned', 'Easy' button, Checkbox checked state.
  actionReset: "", // Location: 'Reset Progress' button in lists.
  actionRefresh: "", // Location: 'Hard' button in review.
  actionDownload: "", // Location: Settings 'Backup' button.
  actionDisconnect: "", // Location: Settings 'Disconnect' button.
  
  // === UI ELEMENTS ===
  checkboxUnchecked: "", // Location: Empty checkbox in lists.
  arrowRight: "", // Location: 'Enter Dojo', 'Next' buttons.
  arrowLeft: "", // Location: 'Previous' buttons.
  
  // === STATUS INDICATORS ===
  statusSuccess: "", // Location: 'Ready' file status.
  statusWarning: "", // Location: 'Created' file status.
  statusError: "", // Location: Error messages.
  
  // === REVIEW & LEARNING ===
  iconClock: "", // Location: 'Due' label in review cards.
  iconSparkles: "", // Location: 'New' label in review cards.
  iconConfig: "", // Location: 'Configure Session' button.
  iconInfo: "", // Location: 'How it works' button.
  iconLayers: "", // Location: 'Cards per session' label, 'Start Mix' button.
  iconPlay: "", // Location: 'Start Mix' button.
  iconBrain: "", // Location: Review header logo.
};
