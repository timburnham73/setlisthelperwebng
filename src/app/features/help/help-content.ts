export interface HelpTopic {
  question: string;
  answer: string;
}

export interface HelpSection {
  title: string;
  icon: string;
  topics: HelpTopic[];
}

export interface HelpPageContent {
  title: string;
  metaDescription: string;
  pageTitle: string;
  sections: HelpSection[];
}

export const HELP_CONTENT: Record<string, HelpPageContent> = {
  ios: {
    title: 'iOS Help',
    pageTitle: 'Band Central - iOS Help',
    metaDescription: 'Help and support for the Band Central iOS app. Learn about songs, setlists, lyrics, ChordPro, metronome, audio player, AirTurn pedal support, and more.',
    sections: [
      {
        title: 'Getting Started',
        icon: 'rocket_launch',
        topics: [
          {
            question: 'How do I create an account?',
            answer: 'Open Band Central and tap "Sign Up." You can create an account using your email address or sign in with your Google account. Once signed in, you can create or join a band to start adding songs and setlists.'
          },
          {
            question: 'How do I sign in?',
            answer: 'Tap "Sign In" and enter your email and password, or use "Sign in with Google." If you\'ve forgotten your password, tap "Forgot Password" to receive a reset email.'
          },
          {
            question: 'How do bands work?',
            answer: 'Bands are shared workspaces where members collaborate on songs and setlists. One person creates the band and invites others by sharing the band code. All band members see the same songs and setlists, and changes sync automatically.'
          },
          {
            question: 'How do I join an existing band?',
            answer: 'Ask your band leader for the band code. Then tap "Join Band" and enter the code. You\'ll immediately have access to the band\'s songs and setlists.'
          }
        ]
      },
      {
        title: 'Songs',
        icon: 'music_note',
        topics: [
          {
            question: 'How do I add a song?',
            answer: 'Tap the "+" button on the Songs tab. Enter the song title, artist, and any other details. You can also add lyrics, set the tempo, time signature, and attach audio files.'
          },
          {
            question: 'How do I edit a song?',
            answer: 'Tap on any song to open it, then tap the edit icon (pencil) to modify the song details, lyrics, tempo, or other fields.'
          },
          {
            question: 'How do I search for songs?',
            answer: 'Use the search bar at the top of the Songs tab to search by title or artist. You can also filter songs by tags.'
          },
          {
            question: 'Can I import songs?',
            answer: 'Yes! You can import songs from text files, ChordPro files, or from your previous Setlist Helper data. See the Import & Export section for details.'
          }
        ]
      },
      {
        title: 'Setlists',
        icon: 'queue_music',
        topics: [
          {
            question: 'How do I create a setlist?',
            answer: 'Go to the Setlists tab and tap the "+" button. Give your setlist a name, then add songs from your band\'s song library. You can add the same song to multiple setlists.'
          },
          {
            question: 'How do I reorder songs in a setlist?',
            answer: 'In the setlist editor, press and hold on a song, then drag it to the desired position. Your changes are saved automatically.'
          },
          {
            question: 'How does setlist timing work?',
            answer: 'Band Central calculates the total setlist duration based on each song\'s duration. This helps you plan your sets to fit time slots. Set each song\'s duration in the song editor.'
          },
          {
            question: 'Can I share a setlist with my band?',
            answer: 'Setlists are automatically shared with all members of your band. Everyone sees the same setlists and any changes sync in real time.'
          }
        ]
      },
      {
        title: 'Lyrics & ChordPro',
        icon: 'article',
        topics: [
          {
            question: 'What is ChordPro format?',
            answer: 'ChordPro is a standard format for writing lyrics with chord notations. Chords are placed in square brackets above the lyrics, like [G]Amazing [D]grace. Band Central renders ChordPro with chords highlighted and properly positioned above the lyrics.'
          },
          {
            question: 'How do I transpose chords?',
            answer: 'When viewing a song with ChordPro lyrics, tap the transpose button (up/down arrows) to shift all chords up or down by semitones. The transposition is saved per song.'
          },
          {
            question: 'How does auto-scroll work?',
            answer: 'In the lyrics viewer, tap the auto-scroll button to start scrolling through the lyrics automatically. You can adjust the scroll speed using the speed controls. This is great for hands-free performance.'
          },
          {
            question: 'Can I change the font size?',
            answer: 'Yes! Use the pinch-to-zoom gesture on the lyrics view to adjust the text size, or use the zoom controls in the toolbar. Your preferred zoom level is remembered.'
          }
        ]
      },
      {
        title: 'Metronome',
        icon: 'timer',
        topics: [
          {
            question: 'How do I use the metronome?',
            answer: 'Open any song and tap the metronome icon. The metronome uses the tempo (BPM) and time signature set for that song. Tap the play button to start the click track.'
          },
          {
            question: 'How do I set the tempo?',
            answer: 'Edit the song and set the BPM (beats per minute) in the tempo field. You can also use the tap tempo feature — tap the "Tap" button rhythmically and the app will calculate the BPM for you.'
          },
          {
            question: 'Can I change the time signature?',
            answer: 'Yes. In the song editor, set the time signature (e.g., 4/4, 3/4, 6/8). The metronome will accent the first beat of each measure accordingly.'
          }
        ]
      },
      {
        title: 'Audio Player',
        icon: 'headphones',
        topics: [
          {
            question: 'How do I attach audio to a song?',
            answer: 'Edit the song and tap "Add Audio." You can select an audio file from your device or from Dropbox. Supported formats include MP3, M4A, and WAV.'
          },
          {
            question: 'How do I play audio?',
            answer: 'Open a song that has audio attached and tap the play button. You can control playback with play/pause, and seek through the track using the progress slider.'
          }
        ]
      },
      {
        title: 'Bluetooth Pedal Support',
        icon: 'settings_remote',
        topics: [
          {
            question: 'What Bluetooth pedals are supported?',
            answer: 'Band Central on iOS supports AirTurn Bluetooth pedals (such as the AirTurn PED, DUO, and QUAD). These pedals connect via Bluetooth and allow hands-free page turning and control.'
          },
          {
            question: 'How do I set up my AirTurn pedal?',
            answer: 'First, pair your AirTurn pedal with your iOS device in Settings > Bluetooth. Then open Band Central and go to Settings > Bluetooth Pedal. Select your pedal and configure the button actions (e.g., next page, previous page, scroll).'
          },
          {
            question: 'What actions can I assign to pedal buttons?',
            answer: 'You can assign actions such as: scroll up, scroll down, next song, previous song, toggle auto-scroll, and toggle metronome. Configure these in Settings > Bluetooth Pedal.'
          }
        ]
      },
      {
        title: 'Tags',
        icon: 'label',
        topics: [
          {
            question: 'How do I create tags?',
            answer: 'Go to the Tags section and tap "+" to create a new tag. Give it a name (e.g., "Rock," "Acoustic," "Favorites"). Tags help you organize and filter your songs.'
          },
          {
            question: 'How do I tag a song?',
            answer: 'Edit a song and scroll to the Tags section. Tap to select one or more tags to assign to that song. You can also manage tags from the song list.'
          },
          {
            question: 'How do I filter songs by tag?',
            answer: 'On the Songs tab, tap the filter icon and select one or more tags. Only songs with those tags will be shown. This is useful for quickly finding songs by genre, mood, or any category you define.'
          }
        ]
      },
      {
        title: 'Cloud Sync',
        icon: 'cloud_sync',
        topics: [
          {
            question: 'How does cloud sync work?',
            answer: 'Band Central automatically syncs your songs, setlists, and settings to the cloud whenever you have an internet connection. All band members see changes in real time.'
          },
          {
            question: 'Can I use the app offline?',
            answer: 'Yes! Your data is cached locally on your device. You can view and edit songs and setlists without an internet connection. Changes will sync automatically when you reconnect.'
          },
          {
            question: 'What if there\'s a sync conflict?',
            answer: 'Band Central uses a last-write-wins approach for sync conflicts. If two people edit the same song simultaneously, the most recent change is kept. We recommend coordinating edits with your band members to avoid conflicts.'
          }
        ]
      },
      {
        title: 'Import & Export',
        icon: 'import_export',
        topics: [
          {
            question: 'How do I import from Setlist Helper?',
            answer: 'If you\'re migrating from the Setlist Helper app, see our detailed <a href="/help/migration">Migration Guide</a> for step-by-step instructions on importing your data.'
          },
          {
            question: 'What file formats can I import?',
            answer: 'You can import plain text (.txt) files and ChordPro (.cho, .chopro, .chordpro) files as song lyrics. You can also import audio files in MP3, M4A, and WAV formats.'
          },
          {
            question: 'How do I import files?',
            answer: 'Go to your band and tap the Import button. You can import lyrics and documents from Dropbox. Place your files in a Dropbox folder and connect your Dropbox account when prompted.'
          },
          {
            question: 'Can I export my data?',
            answer: 'Yes. You can export individual songs or your entire song library. Exports include song details, lyrics, and metadata in a portable format.'
          }
        ]
      },
      {
        title: 'Settings',
        icon: 'settings',
        topics: [
          {
            question: 'How do I change the app appearance?',
            answer: 'Go to Settings to customize the app appearance. You can adjust display options including text size and performance mode settings.'
          },
          {
            question: 'What is performance mode?',
            answer: 'Performance mode optimizes the display for on-stage use. It can increase text size, simplify the interface, and keep the screen awake during performances.'
          }
        ]
      },
      {
        title: 'Migrating from Setlist Helper',
        icon: 'swap_horiz',
        topics: [
          {
            question: 'How do I migrate from Setlist Helper to Band Central?',
            answer: 'We have a dedicated migration guide that walks you through the entire process step by step. Visit the <a href="/help/migration">Setlist Helper to Band Central Migration Guide</a> for complete instructions.'
          }
        ]
      },
      {
        title: 'Troubleshooting & FAQ',
        icon: 'help_outline',
        topics: [
          {
            question: 'The app is running slowly. What can I do?',
            answer: 'Try closing and reopening the app. Make sure you\'re running the latest version from the App Store. If the issue persists, try signing out and signing back in to refresh your data.'
          },
          {
            question: 'My changes aren\'t syncing. What should I do?',
            answer: 'Check your internet connection. Band Central requires an active connection to sync changes. If you\'re connected but still having issues, try force-closing the app and reopening it.'
          },
          {
            question: 'How do I contact support?',
            answer: 'Visit our <a href="/contact">contact page</a> to submit a support request. Please include your device model and iOS version to help us troubleshoot.'
          }
        ]
      }
    ]
  },

  android: {
    title: 'Android Help',
    pageTitle: 'Band Central - Android Help',
    metaDescription: 'Help and support for the Band Central Android app. Learn about songs, setlists, lyrics, ChordPro, metronome, audio player, Bluetooth pedal support, and more.',
    sections: [
      {
        title: 'Getting Started',
        icon: 'rocket_launch',
        topics: [
          {
            question: 'How do I create an account?',
            answer: 'Open Band Central and tap "Sign Up." You can create an account using your email address or sign in with your Google account. Once signed in, you can create or join a band to start adding songs and setlists.'
          },
          {
            question: 'How do I sign in?',
            answer: 'Tap "Sign In" and enter your email and password, or use "Sign in with Google." If you\'ve forgotten your password, tap "Forgot Password" to receive a reset email.'
          },
          {
            question: 'How do bands work?',
            answer: 'Bands are shared workspaces where members collaborate on songs and setlists. One person creates the band and invites others by sharing the band code. All band members see the same songs and setlists, and changes sync automatically.'
          },
          {
            question: 'How do I join an existing band?',
            answer: 'Ask your band leader for the band code. Then tap "Join Band" and enter the code. You\'ll immediately have access to the band\'s songs and setlists.'
          }
        ]
      },
      {
        title: 'Songs',
        icon: 'music_note',
        topics: [
          {
            question: 'How do I add a song?',
            answer: 'Tap the "+" button on the Songs tab. Enter the song title, artist, and any other details. You can also add lyrics, set the tempo, time signature, and attach audio files.'
          },
          {
            question: 'How do I edit a song?',
            answer: 'Tap on any song to open it, then tap the edit icon (pencil) to modify the song details, lyrics, tempo, or other fields.'
          },
          {
            question: 'How do I search for songs?',
            answer: 'Use the search bar at the top of the Songs tab to search by title or artist. You can also filter songs by tags.'
          },
          {
            question: 'Can I import songs?',
            answer: 'Yes! You can import songs from text files, ChordPro files, or from your previous Setlist Helper data. See the Import & Export section for details.'
          }
        ]
      },
      {
        title: 'Setlists',
        icon: 'queue_music',
        topics: [
          {
            question: 'How do I create a setlist?',
            answer: 'Go to the Setlists tab and tap the "+" button. Give your setlist a name, then add songs from your band\'s song library. You can add the same song to multiple setlists.'
          },
          {
            question: 'How do I reorder songs in a setlist?',
            answer: 'In the setlist editor, press and hold on a song, then drag it to the desired position. Your changes are saved automatically.'
          },
          {
            question: 'How does setlist timing work?',
            answer: 'Band Central calculates the total setlist duration based on each song\'s duration. This helps you plan your sets to fit time slots. Set each song\'s duration in the song editor.'
          },
          {
            question: 'Can I share a setlist with my band?',
            answer: 'Setlists are automatically shared with all members of your band. Everyone sees the same setlists and any changes sync in real time.'
          }
        ]
      },
      {
        title: 'Lyrics & ChordPro',
        icon: 'article',
        topics: [
          {
            question: 'What is ChordPro format?',
            answer: 'ChordPro is a standard format for writing lyrics with chord notations. Chords are placed in square brackets above the lyrics, like [G]Amazing [D]grace. Band Central renders ChordPro with chords highlighted and properly positioned above the lyrics.'
          },
          {
            question: 'How do I transpose chords?',
            answer: 'When viewing a song with ChordPro lyrics, tap the transpose button (up/down arrows) to shift all chords up or down by semitones. The transposition is saved per song.'
          },
          {
            question: 'How does auto-scroll work?',
            answer: 'In the lyrics viewer, tap the auto-scroll button to start scrolling through the lyrics automatically. You can adjust the scroll speed using the speed controls. This is great for hands-free performance.'
          },
          {
            question: 'Can I change the font size?',
            answer: 'Yes! Use the pinch-to-zoom gesture on the lyrics view to adjust the text size, or use the zoom controls in the toolbar. Your preferred zoom level is remembered.'
          }
        ]
      },
      {
        title: 'Metronome',
        icon: 'timer',
        topics: [
          {
            question: 'How do I use the metronome?',
            answer: 'Open any song and tap the metronome icon. The metronome uses the tempo (BPM) and time signature set for that song. Tap the play button to start the click track.'
          },
          {
            question: 'How do I set the tempo?',
            answer: 'Edit the song and set the BPM (beats per minute) in the tempo field. You can also use the tap tempo feature — tap the "Tap" button rhythmically and the app will calculate the BPM for you.'
          },
          {
            question: 'Can I change the time signature?',
            answer: 'Yes. In the song editor, set the time signature (e.g., 4/4, 3/4, 6/8). The metronome will accent the first beat of each measure accordingly.'
          }
        ]
      },
      {
        title: 'Audio Player',
        icon: 'headphones',
        topics: [
          {
            question: 'How do I attach audio to a song?',
            answer: 'Edit the song and tap "Add Audio." You can select an audio file from your device or from Dropbox. Supported formats include MP3, M4A, and WAV.'
          },
          {
            question: 'How do I play audio?',
            answer: 'Open a song that has audio attached and tap the play button. You can control playback with play/pause, and seek through the track using the progress slider.'
          }
        ]
      },
      {
        title: 'Bluetooth Pedal Support',
        icon: 'settings_remote',
        topics: [
          {
            question: 'What Bluetooth pedals are supported?',
            answer: 'Band Central on Android supports generic Bluetooth pedals that use standard Bluetooth HID (Human Interface Device) profiles. Most page-turning pedals available on Amazon or music retailers should work.'
          },
          {
            question: 'How do I set up my Bluetooth pedal?',
            answer: 'First, pair your Bluetooth pedal with your Android device in Settings > Connected devices > Bluetooth. Then open Band Central and go to Settings > Bluetooth Pedal. The app will detect your paired pedal and let you configure button actions.'
          },
          {
            question: 'What actions can I assign to pedal buttons?',
            answer: 'You can assign actions such as: scroll up, scroll down, next song, previous song, toggle auto-scroll, and toggle metronome. Configure these in Settings > Bluetooth Pedal.'
          }
        ]
      },
      {
        title: 'Tags',
        icon: 'label',
        topics: [
          {
            question: 'How do I create tags?',
            answer: 'Go to the Tags section and tap "+" to create a new tag. Give it a name (e.g., "Rock," "Acoustic," "Favorites"). Tags help you organize and filter your songs.'
          },
          {
            question: 'How do I tag a song?',
            answer: 'Edit a song and scroll to the Tags section. Tap to select one or more tags to assign to that song. You can also manage tags from the song list.'
          },
          {
            question: 'How do I filter songs by tag?',
            answer: 'On the Songs tab, tap the filter icon and select one or more tags. Only songs with those tags will be shown. This is useful for quickly finding songs by genre, mood, or any category you define.'
          }
        ]
      },
      {
        title: 'Cloud Sync',
        icon: 'cloud_sync',
        topics: [
          {
            question: 'How does cloud sync work?',
            answer: 'Band Central automatically syncs your songs, setlists, and settings to the cloud whenever you have an internet connection. All band members see changes in real time.'
          },
          {
            question: 'Can I use the app offline?',
            answer: 'Yes! Your data is cached locally on your device. You can view and edit songs and setlists without an internet connection. Changes will sync automatically when you reconnect.'
          },
          {
            question: 'What if there\'s a sync conflict?',
            answer: 'Band Central uses a last-write-wins approach for sync conflicts. If two people edit the same song simultaneously, the most recent change is kept. We recommend coordinating edits with your band members to avoid conflicts.'
          }
        ]
      },
      {
        title: 'Import & Export',
        icon: 'import_export',
        topics: [
          {
            question: 'How do I import from Setlist Helper?',
            answer: 'If you\'re migrating from the Setlist Helper app, see our detailed <a href="/help/migration">Migration Guide</a> for step-by-step instructions on importing your data.'
          },
          {
            question: 'What file formats can I import?',
            answer: 'You can import plain text (.txt) files and ChordPro (.cho, .chopro, .chordpro) files as song lyrics. You can also import audio files in MP3, M4A, and WAV formats.'
          },
          {
            question: 'How do I import files?',
            answer: 'Go to your band and tap the Import button. You can import lyrics and documents from Dropbox. Place your files in a Dropbox folder and connect your Dropbox account when prompted.'
          },
          {
            question: 'Can I export my data?',
            answer: 'Yes. You can export individual songs or your entire song library. Exports include song details, lyrics, and metadata in a portable format.'
          }
        ]
      },
      {
        title: 'Settings',
        icon: 'settings',
        topics: [
          {
            question: 'How do I change the app appearance?',
            answer: 'Go to Settings to customize the app appearance. You can adjust display options including text size and performance mode settings.'
          },
          {
            question: 'What is performance mode?',
            answer: 'Performance mode optimizes the display for on-stage use. It can increase text size, simplify the interface, and keep the screen awake during performances.'
          }
        ]
      },
      {
        title: 'Migrating from Setlist Helper',
        icon: 'swap_horiz',
        topics: [
          {
            question: 'How do I migrate from Setlist Helper to Band Central?',
            answer: 'We have a dedicated migration guide that walks you through the entire process step by step. Visit the <a href="/help/migration">Setlist Helper to Band Central Migration Guide</a> for complete instructions.'
          }
        ]
      },
      {
        title: 'Troubleshooting & FAQ',
        icon: 'help_outline',
        topics: [
          {
            question: 'The app is running slowly. What can I do?',
            answer: 'Try closing and reopening the app. Make sure you\'re running the latest version from the Google Play Store. If the issue persists, try clearing the app cache in Android Settings > Apps > Band Central > Storage > Clear Cache.'
          },
          {
            question: 'My changes aren\'t syncing. What should I do?',
            answer: 'Check your internet connection. Band Central requires an active connection to sync changes. If you\'re connected but still having issues, try force-closing the app and reopening it.'
          },
          {
            question: 'How do I contact support?',
            answer: 'Visit our <a href="/contact">contact page</a> to submit a support request. Please include your device model and Android version to help us troubleshoot.'
          }
        ]
      }
    ]
  },

  web: {
    title: 'Website Help',
    pageTitle: 'Band Central - Website Help',
    metaDescription: 'Help and support for the Band Central website. Learn about managing bands, songs, setlists, tags, importing data, and account settings.',
    sections: [
      {
        title: 'Getting Started',
        icon: 'rocket_launch',
        topics: [
          {
            question: 'How do I create an account?',
            answer: 'Visit bandcentral.com and click "Sign Up." You can create an account using your email address or sign in with your Google account.'
          },
          {
            question: 'How do I sign in?',
            answer: 'Click "Login" and enter your email and password, or use "Sign in with Google." If you\'ve forgotten your password, click "Forgot Password" to receive a reset email.'
          }
        ]
      },
      {
        title: 'Bands',
        icon: 'groups',
        topics: [
          {
            question: 'How do I create a band?',
            answer: 'After signing in, click "Create Band" on the dashboard. Enter your band name and any details. You\'ll be the owner of the band and can invite other members.'
          },
          {
            question: 'How do I manage band members?',
            answer: 'Open your band and go to the Members section. You can share the band code with others so they can join. As the band owner, you can manage member roles and remove members.'
          },
          {
            question: 'How do I switch between bands?',
            answer: 'If you belong to multiple bands, use the band selector on the dashboard to switch between them. Each band has its own set of songs, setlists, and tags.'
          }
        ]
      },
      {
        title: 'Songs',
        icon: 'music_note',
        topics: [
          {
            question: 'How do I add a song?',
            answer: 'Navigate to the Songs section and click the "Add Song" button. Enter the song title, artist, lyrics, tempo, and any other details.'
          },
          {
            question: 'How do I edit a song?',
            answer: 'Click on any song to open it, then click the edit button to modify the song details, lyrics, or other fields.'
          },
          {
            question: 'How do I manage songs?',
            answer: 'The Songs section shows all songs in your band. You can search, sort, and filter songs. Click on a song to view its details, edit it, or delete it (owner only).'
          }
        ]
      },
      {
        title: 'Setlists',
        icon: 'queue_music',
        topics: [
          {
            question: 'How do I create a setlist?',
            answer: 'Go to the Setlists section and click "Add Setlist." Give it a name, then add songs from your band\'s song library.'
          },
          {
            question: 'How do I manage setlists?',
            answer: 'Open a setlist to view its songs. You can reorder songs by dragging, add or remove songs, and edit the setlist name. Changes sync to all band members automatically.'
          }
        ]
      },
      {
        title: 'Tags',
        icon: 'label',
        topics: [
          {
            question: 'How do I create and manage tags?',
            answer: 'Go to the Tags section to create, edit, and delete tags. Tags help organize your songs by genre, mood, difficulty, or any category you choose.'
          },
          {
            question: 'How do I assign tags to songs?',
            answer: 'Edit a song and use the Tags field to assign one or more tags. You can then filter the song list by tag to quickly find songs in a category.'
          }
        ]
      },
      {
        title: 'Import',
        icon: 'upload',
        topics: [
          {
            question: 'How do I import from Setlist Helper?',
            answer: 'If you\'re migrating from the Setlist Helper app, see our detailed <a href="/help/migration">Migration Guide</a> for step-by-step instructions on importing your data into Band Central.'
          },
          {
            question: 'How do I import files?',
            answer: 'On your band card, click the "Import" button. You can import songs, lyrics, and documents from Dropbox. Place your files in a Dropbox folder before starting the import.'
          }
        ]
      },
      {
        title: 'Account Settings',
        icon: 'manage_accounts',
        topics: [
          {
            question: 'How do I update my profile?',
            answer: 'Click on your profile icon and go to Account Settings. You can update your display name and profile information.'
          },
          {
            question: 'How do I change display preferences?',
            answer: 'In Account Settings, you can customize display preferences such as default views and other options to personalize your experience.'
          }
        ]
      },
      {
        title: 'Troubleshooting & FAQ',
        icon: 'help_outline',
        topics: [
          {
            question: 'The website is loading slowly. What can I do?',
            answer: 'Try refreshing the page or clearing your browser cache. Make sure you\'re using a modern browser (Chrome, Firefox, Safari, or Edge) with the latest updates.'
          },
          {
            question: 'My changes aren\'t saving. What should I do?',
            answer: 'Check your internet connection. If you\'re connected but still having issues, try signing out and signing back in. If the problem persists, contact support.'
          },
          {
            question: 'How do I contact support?',
            answer: 'Visit our <a href="/contact">contact page</a> to submit a support request. Please include your browser name and version to help us troubleshoot.'
          }
        ]
      }
    ]
  }
};
