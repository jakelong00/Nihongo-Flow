
export const STRINGS = {
  common: {
    appName: "Nihongo Flow",
    appSubtitle: "Local Learning Engine",
    loading: "Checking data...",
    cancel: "Cancel",
    save: "Save",
    update: "Update",
    delete: "Delete",
    edit: "Edit",
    actions: "Actions",
    id: "ID",
    searchPlaceholder: "Search...",
    noItems: "No items found.",
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
    title: "Nihongo Flow",
    subtitle: "Your local-first Japanese learning companion.",
    selectFolderTitle: "Select Learning Folder",
    selectFolderDesc: "Select a folder on your computer to store your study data (CSV files).",
    btnSelect: "Select Learning Folder",
    browserStorageOption: "Or if folder access is blocked",
    btnBrowserStorage: "Use Browser Storage (Demo Mode)",
    browserStorageNote: "Note: Folder access requires a browser with File System Access API support (Chrome, Edge, Opera).",
    enterDojo: "Enter Dojo",
    fileStatusTitle: "File Status",
    localStorageBadge: "Local Storage",
    statusReady: "Ready",
    statusCreated: "Created",
    errors: {
      security: "Browser security blocks folder access in this environment (e.g. iframe). Please use Browser Storage mode below.",
      notSupported: "Your browser does not support the File System Access API. Please use Browser Storage mode below.",
      generic: "Could not access folder: "
    }
  },
  dashboard: {
    title: "Progress Dashboard",
    reviewActivity: "Review Activity",
    noReviewData: "No review data available yet. Start reviewing!",
    learnedItems: "Learned Items",
    totalPrefix: "Total: ",
    learnedSuffix: " learned items",
  },
  vocab: {
    title: "Vocabulary Hub",
    addBtn: "Add Word",
    formTitle: "Manage Vocabulary",
    searchPlaceholder: "Search vocabulary...",
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
    title: "Kanji Dojo",
    addBtn: "Add Kanji",
    searchPlaceholder: "Search kanji...",
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
    title: "Grammar Library",
    addBtn: "Add Rule",
    searchPlaceholder: "Search grammar...",
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
    title: "Learn",
    description: "We prioritize items you are about to forget.",
    algoInfo: "Algorithm: Modified SM-2",
    mixReviewBtn: "Start Session",
    configureBtn: "Configure Session",
    quitSession: "Quit Session",
    tapToReveal: "Tap card to reveal",
    readingsLabel: "Readings",
    configTitle: "Session Configuration",
    buttons: {
      forgot: "Forgot",
      hard: "Hard",
      easy: "Easy",
      reset: "Reset",
      sooner: "Sooner",
      later: "Later"
    },
    labels: {
        due: "Due",
        new: "New",
        total: "Total"
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
    noItemsAlert: "No items found for the selected criteria."
  },
  settings: {
    title: "Settings",
    fileManagement: "File Management",
    backupTitle: "Backup Data",
    backupDesc: "Download current CSVs",
    disconnectTitle: "Disconnect Folder",
    disconnectDesc: "Close the current directory and return to home",
    btnDisconnect: "Disconnect",
    appInfo: "Application Info",
    labels: {
        version: "Version: 1.1.0",
        engine: "Storage Engine: File System Access API",
        theme: "Theme: System Default"
    }
  },
  about: {
    title: "User Guide",
    welcome: "Welcome to Nihongo Flow!",
    philosophyTitle: "Local-First Philosophy",
    philosophyDesc: "Unlike most apps, Nihongo Flow doesn't store your data on a server. Your study progress, vocabulary, and notes live directly on your computer in human-readable CSV files. You own your data.",
    howToTitle: "How to use Nihongo Flow",
    steps: [
      {
        title: "1. Connect Your Data",
        desc: "On the home screen, select a folder on your computer. The app will create four CSV files (vocab, kanji, grammar, stats) inside it. You can open these files in Excel or Notion anytime!"
      },
      {
        title: "2. Build Your Library",
        desc: "Go to the Vocabulary, Kanji, or Grammar tabs to add items you want to learn. You can tag them by JLPT level and Chapter for easier organization."
      },
      {
        title: "3. Start Learning",
        desc: "Click 'Learn' in the sidebar. Our Spaced Repetition (SRS) algorithm picks items that are 'due' for review. New items are mixed in gradually."
      },
      {
        title: "4. Master the Cards",
        desc: "During a session, be honest! If you recalled a word instantly, hit 'Easy'. If you struggled, hit 'Hard'. If you forgot, hit 'Forgot' to reset that item's learning cycle."
      }
    ]
  },
  errors: {
      duplicateWord: "This word already exists in your vocabulary list.",
      duplicateKanji: "This character already exists in your kanji list.",
      duplicateGrammar: "This grammar rule already exists."
  }
};
