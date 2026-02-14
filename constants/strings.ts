
export const STRINGS = {
  common: {
    appName: "Nihongo Flow", // Main application name
    appSubtitle: "Local Learning Engine", // Subtitle shown in sidebar
    loading: "Checking data...", // Loading state text
    cancel: "Cancel", // Cancel button text
    save: "Save", // Save button text
    update: "Update", // Update button text
    delete: "Delete", // Delete button text
    edit: "Edit", // Edit button text
    actions: "Actions", // Actions column header
    id: "ID", // ID column header
    searchPlaceholder: "Search...", // Default search input placeholder
    noItems: "No items found.", // Empty state message
    confirmDelete: "Are you sure you want to delete this item?",
    confirmMassDelete: "Are you sure you want to delete the selected items?",
    selected: "selected",
    deleteSelected: "Delete Selected",
    markLearned: "Mark as Learned",
    status: {
        new: "New",
        learning: "Learning",
        review: "Review",
        mastered: "Mastered"
    }
  },
  home: {
    title: "Nihongo Flow", // Landing page title
    subtitle: "Your local-first Japanese learning companion.", // Landing page subtitle
    selectFolderTitle: "Select Learning Folder", // Title for the folder selection card
    selectFolderDesc: "Select a folder on your computer to store your study data (CSV files).", // Description for folder selection
    btnSelect: "Select Learning Folder", // Main CTA button text
    browserStorageOption: "Or if folder access is blocked", // Divider text
    btnBrowserStorage: "Use Browser Storage (Demo Mode)", // Browser storage button text
    browserStorageNote: "Note: Folder access requires a browser with File System Access API support (Chrome, Edge, Opera).", // Footer note
    enterDojo: "Enter Dojo", // Button to enter the app after loading
    fileStatusTitle: "File Status", // Title for the file status list
    localStorageBadge: "Local Storage", // Badge indicating local storage mode
    statusReady: "Ready", // Status when file exists
    statusCreated: "Created", // Status when file is created new
    errors: {
      security: "Browser security blocks folder access in this environment (e.g. iframe). Please use Browser Storage mode below.",
      notSupported: "Your browser does not support the File System Access API. Please use Browser Storage mode below.",
      generic: "Could not access folder: "
    }
  },
  dashboard: {
    title: "Progress Dashboard", // Dashboard page title
    reviewActivity: "Review Activity", // Chart section title
    noReviewData: "No review data available yet. Start reviewing!", // Empty chart message
    learnedItems: "Learned Items", // Legend for chart
    totalPrefix: "Total: ", // Prefix for total count badge
    learnedSuffix: " learned items", // Suffix for learned count
  },
  vocab: {
    title: "Vocabulary Hub", // Page title
    addBtn: "Add Word", // Button to open add form
    formTitle: "Manage Vocabulary", // Form header
    searchPlaceholder: "Search vocabulary...", // Specific search placeholder
    placeholders: {
      word: "Word (e.g. 猫)",
      reading: "Reading (e.g. ねこ)",
      meaning: "Meaning",
      chapter: "Chapter"
    },
    tableHeaders: {
      word: "Word",
      reading: "Reading",
      meaning: "Meaning",
      level: "Level",
      chapter: "Chapter"
    }
  },
  kanji: {
    title: "Kanji Dojo", // Page title
    addBtn: "Add Kanji", // Button text
    searchPlaceholder: "Search kanji...", // Search placeholder
    placeholders: {
      char: "Char",
      onyomi: "Onyomi",
      kunyomi: "Kunyomi",
      meaning: "Meaning",
      strokes: "Strokes",
      chapter: "Chapter"
    }
  },
  grammar: {
    title: "Grammar Library", // Page title
    addBtn: "Add Rule", // Button text
    searchPlaceholder: "Search grammar...", // Search placeholder
    placeholders: {
      rule: "Rule (e.g. ~てもいい)",
      explanation: "Explanation",
      example: "Example Sentence",
      chapter: "Chapter"
    },
    exampleLabel: "Examples",
    addExample: "Add Sentence"
  },
  learn: {
    title: "Study Mode",
    subtitle: "Filter and study specific items directly.",
    filterTitle: "Study Filters",
    selectCategory: "Select Category",
    filterLevel: "JLPT Level",
    allLevels: "All Levels",
    filterChapter: "Chapter",
    allChapters: "All Chapters",
    filterLimit: "Item Limit (0 for all)",
    startBtn: "Start Studying",
    flip: "Tap card to flip",
    prev: "Previous",
    next: "Next"
  },
  review: {
    title: "Learn", // Renamed from "Spaced Repetition Review"
    description: "We prioritize items you are about to forget.", // Page description
    algoInfo: "Algorithm: Modified SM-2", // Technical info
    mixReviewBtn: "Start Session", // Button for mixed review
    configureBtn: "Configure Session",
    quitSession: "Quit Session", // Button to exit active review
    tapToReveal: "Tap card to reveal", // Hint on flashcard front
    readingsLabel: "Readings", // Label for kanji readings on back
    configTitle: "Session Configuration",
    buttons: {
      forgot: "Forgot", // SRS Result 1
      hard: "Hard", // SRS Result 2
      easy: "Easy", // SRS Result 3
      reset: "Reset", // Subtext for Forgot
      sooner: "Sooner", // Subtext for Hard
      later: "Later" // Subtext for Easy
    },
    labels: {
        due: "Due", // Label for due count
        new: "New", // Label for new items count
        total: "Total" // Label for total items count
    },
    guide: {
        title: "How Spaced Repetition Works",
        intro: "This system schedules reviews at the most efficient time to ensure long-term retention.",
        stages: {
            new: { title: "New", desc: "Items you haven't seen yet." },
            learning: { title: "Learning", desc: "Items in early stages (Interval < 3 days)." },
            review: { title: "Review", desc: "Items being spaced out (Interval > 3 days)." },
            mastered: { title: "Mastered", desc: "Items known well (Interval > 21 days)." }
        },
        actions: {
            forgot: { title: "Forgot", desc: "Resets progress to Day 0. Use this if you don't recall the item." },
            hard: { title: "Hard", desc: "Small interval increase (1.2x). Use this if you struggled to recall." },
            easy: { title: "Easy", desc: "Large interval increase (2.5x). Use this if you recalled it instantly." }
        }
    },
    noItemsAlert: "No items found for the selected criteria." // Alert when starting empty session
  },
  settings: {
    title: "Settings", // Page title
    fileManagement: "File Management", // Section header
    backupTitle: "Backup Data", // Item title
    backupDesc: "Download current CSVs", // Item description
    disconnectTitle: "Disconnect Folder", // Item title
    disconnectDesc: "Close the current directory and return to home", // Item description
    btnDisconnect: "Disconnect", // Button text
    appInfo: "Application Info", // Section header
    labels: {
        version: "Version: 1.1.0",
        engine: "Storage Engine: File System Access API",
        theme: "Theme: System Default"
    }
  },
  errors: {
      duplicateWord: "This word already exists in your vocabulary list.",
      duplicateKanji: "This character already exists in your kanji list.",
      duplicateGrammar: "This grammar rule already exists."
  }
};
