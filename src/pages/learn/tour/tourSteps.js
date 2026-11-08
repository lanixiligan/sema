// The steps of Learn's first-visit tour (2026-11-07), in order. Edit this list
// to add, remove or reorder steps; what each field means is at the top of
// Tour.jsx.
export const TOUR_STEPS = [
  {
    title: 'Welcome to Sema',
    text: 'Sema teaches you the ASL alphabet with your webcam. Here’s a quick look around Learn. Your camera stays off until you turn it on.',
  },
  {
    title: 'Pick a letter',
    text: 'All 26 letters are here. Start at A, or pick any letter to practise it.',
    target: ['.learn-strip'],
  },
  {
    title: 'Your signing hand',
    text: 'Sign with your left or right hand? Switch it here, and the pictures turn to match.',
    target: ['.learn .camera-controls-segment', '.learn .practice-camera'],
  },
  {
    title: 'Drawing or 3D hand',
    text: 'See each letter as a drawing (2D) or as a hand in 3D.',
    target: ['.learn-picture .hand-view-switch'],
  },
  {
    title: 'Turn the hand around',
    text: 'In 3D, grab the hand and drag it to see the letter from any side. Try it.',
    target: ['.learn-picture'],
    view: '3d',
    interactive: true,
  },
  {
    title: 'Finger numbers',
    text: 'Numbers shows or hides the fingertip numbers, 1 for the thumb to 5 for the pinky. The finger checklist uses the same numbers.',
    target: ['.learn-picture .hand-numbers-toggle', '.learn-picture'],
    view: '3d',
  },
  {
    title: 'See it larger',
    text: 'This button opens the picture large, to study the handshape up close.',
    target: ['.learn-picture .picture-expand'],
  },
  // The last two ring their links in the menu, or on a phone (where the menu
  // is folded away) its burger button.
  {
    title: 'Two quizzes',
    text: 'Quiz tests what you’ve learned, two ways. Fingerspell: sign the letters of words from memory, with your camera. Guess the letter: name the letter a hand sign makes, no camera needed.',
    target: ['#main-menu a[href="/quiz"]', '.menu-toggle'],
  },
  {
    title: 'About Sema',
    text: 'How Sema works, and what it does with your data: everything stays in your browser.',
    target: ['#main-menu a[href="/about"]', '.menu-toggle'],
  },
]
