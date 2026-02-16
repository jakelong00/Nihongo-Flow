export const STRINGS = {
  common: {
    appName: "Nihongo Flow",
    appSubtitle: "Learning Engine",
    version: "v1.2.0 FLOW",
    loading: "Initializing dojo...",
    cancel: "Cancel",
    save: "Save Changes",
    create: "Create Entry",
    update: "Update Record",
    delete: "Delete",
    edit: "Edit",
    actions: "Actions",
    searchPlaceholder: "Scan collection...",
    noItems: "No scrolls found in the dojo.",
    confirmDelete: "Discard this record forever?",
    confirmMassDelete: "Discard these selected records?",
    selected: "selected",
    deleteSelected: "Discard Selection",
    markLearned: "Achieved Mastery",
    status: {
        new: "Initiate",
        learning: "Training",
        review: "Refining",
        mastered: "Mastered"
    }
  },
  home: {
    title: "Nihongo Flow",
    subtitle: "Local Study Dojo v1.2",
    syncBtn: "Sync Local Folder",
    guestBtn: "Guest Storage",
    syncNote: "Recommended for persistence",
    readyMsg: "System Ready",
    enterBtn: "Enter the Dojo",
    errors: {
      security: "Browser security blocks folder access. Switching to local mode.",
      notSupported: "Your browser lacks File System Access support. Try Guest mode.",
      generic: "Access Denied: "
    }
  },
  mascot: {
    welcome: "Konnichiwa! Ready to train?",
    dashboard: "Mission Log updated! Check your progress.",
    vocab: "Words are the building blocks. Let's learn!",
    kanji: "Focus on the strokes! Ganbatte!",
    grammar: "Patterns make sentences flow. Study hard!",
    review: "Spaced Repetition is the secret to mastery!",
    settings: "Dojo maintenance? Adjust the system here.",
    about: "The way of the dojo. Read carefully!",
    yatta: "Yatta! You got it!",
    keepGoing: "Don't give up! Again!",
    ikuzo: "Ikuzo! Start the session!"
  },
  dashboard: {
    title: "MISSION LOG",
    subtitle: "Personal Mastery & Progress",
    analytics: "Historical Performance Analytics",
    emptyStats: "LOG ACTIVITY TO GENERATE ANALYTICS"
  },
  vocab: {
    title: "VOCABULARY HUB",
    subtitle: "Managing records",
    addBtn: "ADD WORD",
    closeBtn: "CLOSE",
    placeholders: {
      word: "Word (e.g. 猫)",
      reading: "Reading (e.g. ねこ)",
      meaning: "Meaning (e.g. Cat)",
      chapter: "1"
    }
  },
  kanji: {
    title: "KANJI DOJO",
    subtitle: "Personal Kanji Mastery",
    addBtn: "ADD KANJI",
    placeholders: {
      char: "字",
      onyomi: "On-yomi",
      kunyomi: "Kun-yomi",
      meaning: "Meaning",
      strokes: "0"
    }
  },
  grammar: {
    title: "GRAMMAR LIBRARY",
    subtitle: "Sentence Building Rules",
    addBtn: "ADD RULE",
    exampleLabel: "EXAMPLES",
    newExample: "NEW EXAMPLE",
    placeholders: {
      rule: "〜てもいい",
      explanation: "Usage details...",
      example: "Sample sentence..."
    }
  },
  review: {
    title: "STUDY SESSION",
    subtitle: "Mission Selection",
    startMixed: "Start Mixed Training",
    settings: "Session Settings",
    exit: "EXIT",
    reveal: "[ Tap to Reveal ]",
    forgot: "Forgot",
    hard: "Hard",
    master: "Master",
    noItems: "No items match your training filters."
  },
  // Added missing learn strings
  learn: {
    title: "LEARNING MODE",
    subtitle: "Custom Study Session",
    filterTitle: "Session Configuration",
    selectCategory: "Select Subject",
    filterLevel: "JLPT Level",
    allLevels: "All Levels",
    filterChapter: "Chapter Range",
    allChapters: "All Chapters",
    filterLimit: "Item Limit (0 for all)",
    startBtn: "START TRAINING",
    flip: "[ Tap to Flip Card ]",
    prev: "Previous",
    next: "Next Item"
  },
  about: {
    title: "THE DOJO GUIDE",
    subtitle: "Operational Manual • Nihongo Flow",
    philosophyTitle: "Local-First Sovereignty",
    philosophyDesc: "Your study data lives directly on your computer in human-readable CSV files. You own your progress. No clouds, no logins, just learning.",
    howToTitle: "SYSTEM PROTOCOL",
    spiritTitle: "DOJO SPIRIT",
    spiritDesc: "Consistent daily training is more effective than marathon sessions. Keep your streaks alive and trust the algorithm.",
    steps: [
      {
        title: "1. Connect Data",
        desc: "Select a folder. The app creates local CSV files (vocab, kanji, grammar, stats). You can edit these in Excel or VS Code anytime."
      },
      {
        title: "2. Build Library",
        desc: "Add items in the Vocabulary, Kanji, or Grammar hubs. Organize them by JLPT level and Chapter for focused training."
      },
      {
        title: "3. Start Session",
        desc: "The algorithm prioritizes items due for review. New items are mixed in gradually to prevent burnout."
      },
      {
        title: "4. Master Cards",
        desc: "Be honest with your feedback. Use 'Forgot' for complete resets and 'Master' for items you know instantly."
      }
    ]
  },
  settings: {
    title: "SYSTEM SETTINGS",
    subtitle: "Dojo Configuration",
    backupTitle: "Data Portability",
    backupDesc: "Download your study records to keep a hard copy or migrate devices.",
    backupBtn: "Backup Dictionary",
    disconnectTitle: "Storage Access",
    disconnectDesc: "Disconnect the current folder. Files remain safe on your local drive.",
    disconnectBtn: "Disconnect Folder",
    metaTitle: "Engine Meta"
  }
};