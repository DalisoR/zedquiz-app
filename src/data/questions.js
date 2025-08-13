export const mockQuestions = [
  {
    id: 1,
    gradeLevel: 'Grade 6',
    subject: 'Mathematics',
    topic: 'Fractions',
    questionText: 'What is 1/2 + 1/4?',
    questionType: 'Short-Answer',
    correctAnswer: '3/4',
    explanation: 'To add fractions, you need a common denominator. The common denominator for 2 and 4 is 4. So, 1/2 becomes 2/4. Then, 2/4 + 1/4 = 3/4.'
  },
  {
    id: 2,
    gradeLevel: 'Grade 6',
    subject: 'English',
    topic: 'Nouns',
    questionText: 'Which of the following is a proper noun?',
    questionType: 'Multiple-Choice',
    options: { A: 'boy', B: 'river', C: 'Zambia', D: 'school' },
    correctAnswer: 'C',
    explanation: 'A proper noun is a name used for an individual person, place, or organization, spelled with an initial capital letter. Zambia is the name of a specific country.'
  },
  {
    id: 3,
    gradeLevel: 'Form 2',
    subject: 'Integrated Science',
    topic: 'Biology',
    questionText: 'The powerhouse of the cell is the mitochondria.',
    questionType: 'True/False',
    correctAnswer: 'True',
    explanation: 'Mitochondria are responsible for generating most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy.'
  },
  {
    id: 4,
    gradeLevel: 'Form 5',
    subject: 'History',
    topic: 'World War II',
    questionText: 'In which year did World War II end?',
    questionType: 'Short-Answer',
    correctAnswer: '1945',
    explanation: 'World War II ended in 1945 with the surrender of the Axis powers.'
  },
  {
    id: 5,
    gradeLevel: 'A Levels',
    subject: 'Chemistry',
    topic: 'Acids and Bases',
    questionText: 'What is the pH of a neutral solution?',
    questionType: 'Short-Answer',
    correctAnswer: '7',
    explanation: 'A pH of 7 is considered neutral. Anything below 7 is acidic, and anything above 7 is alkaline (basic).'
  }
];