export const courses = [
  {
    id: 'cnc-machining',
    title: 'CNC Machining',
    summary: 'Program precision parts and master CNC workflows from CAD to production.',
    level: 'Core',
    duration: '8 weeks',
    track: 'Manufacturing',
    highlights: ['G-code fundamentals', 'Toolpath strategies', 'Material setup & fixturing'],
  },
  {
    id: 'electronics',
    title: 'Electronics',
    summary: 'Build circuits, troubleshoot systems, and work confidently with microcontrollers.',
    level: 'Core',
    duration: '6 weeks',
    track: 'Electrical',
    highlights: ['Circuit design', 'Soldering labs', 'Arduino & sensor projects'],
  },
  {
    id: '3d-printing',
    title: '3D Printing & Design',
    summary: 'Design, model, and fabricate components for rapid prototyping and product design.',
    level: 'Core',
    duration: '6 weeks',
    track: 'Fabrication',
    highlights: ['CAD modeling', 'Print calibration', 'Iterative prototyping'],
  },
  {
    id: 'game-creation',
    title: 'Video Game Creation',
    summary: 'Plan, design, and build interactive game experiences with storytelling and code.',
    level: 'Creative',
    duration: '5 weeks',
    track: 'Digital',
    highlights: ['Game design basics', 'Level building', 'Team showcase project'],
  },
  {
    id: 'csec-electrical',
    title: 'CSEC Electrical',
    summary: 'Prepare for CSEC exams with practical electrical theory and lab-driven revision.',
    level: 'Prep',
    duration: '10 weeks',
    track: 'Certification',
    highlights: ['Exam-focused labs', 'Electrical theory', 'Safety standards'],
  },
];

export const scheduleOptions = [
  { value: 'weekday-morning', label: 'Weekday mornings (8:00am - 12:00pm)' },
  { value: 'weekday-afternoon', label: 'Weekday afternoons (1:00pm - 5:00pm)' },
  { value: 'weekday-evening', label: 'Weekday evenings (5:30pm - 8:30pm)' },
  { value: 'weekend-morning', label: 'Saturday mornings (9:00am - 1:00pm)' },
];

export const genderOptions = [
  { value: '', label: 'Select (optional)' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];
