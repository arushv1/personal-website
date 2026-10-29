// Course IDs resolve to the Courses items in portfolio.mjs; work IDs resolve to
// existing project/publication items. Keep course titles and codes there.
// These are proposed thematic connections, not claims about when a course was
// taken or which course was applied to a particular project.
export const courseMapNote='Proposed connections for exploration; details can be refined.';

export const courseBranches=[
  {
    id:'computation',
    title:'Computation & AI',
    description:'Models, data, and intelligent systems.',
    icon:'code',
    courseIds:[
      'research-programming-life-sciences',
      'programming-biomedical-data-analysis',
      'computational-linear-algebra',
      'probability-statistics-data-science',
      'introduction-machine-learning',
      'computational-biology-machine-learning',
    ],
  },
  {
    id:'biomedical',
    title:'Biomedical Systems',
    description:'Physiology, signals, and human health.',
    icon:'heartbeat',
    courseIds:[
      'systems-physiology',
      'molecular-cell-biology',
      'thermodynamics-statistical-mechanics',
      'biomedical-measurements-analysis',
      'biomedical-signals-controls',
    ],
  },
  {
    id:'design',
    title:'Health & Design',
    description:'People, systems, and equitable solutions.',
    icon:'ruler',
    courseIds:[
      'introduction-engineering-hands-on',
      'engineering-design-refugee-health',
    ],
  },
];

export const workNodes=[
  {
    id:'vascupath',
    label:'VascuPath',
    sectionId:'projects',
    itemId:'vascupath',
    description:'Extracting vascular features from brain tissue.',
  },
  {
    id:'threshold',
    label:'Threshold',
    sectionId:'projects',
    itemId:'threshold',
    description:'Clinical trial eligibility and access.',
  },
  {
    id:'symptomai',
    label:'SymptomAI',
    sectionId:'projects',
    itemId:'symptomai',
    description:'Symptom-based disease prediction.',
  },
  {
    id:'bci-motor-rehabilitation',
    label:'BCI publication',
    sectionId:'publications',
    itemId:'bci-motor-rehabilitation',
    description:'Non-invasive brain–computer interfaces for motor rehabilitation.',
  },
];

// Candidate labels help visitors browse the map without adding unverified
// learning outcomes, course descriptions, completion dates, or proficiency.
export const courseSkills={
  'research-programming-life-sciences':'Scientific programming',
  'systems-physiology':'Physiological systems',
  'thermodynamics-statistical-mechanics':'Physical principles',
  'molecular-cell-biology':'Cell biology',
  'probability-statistics-data-science':'Statistical reasoning',
  'introduction-machine-learning':'Machine learning',
  'biomedical-measurements-analysis':'Biomedical measurement',
  'biomedical-signals-controls':'Signal analysis',
  'computational-linear-algebra':'Linear algebra',
  'engineering-design-refugee-health':'Design for health',
  'computational-biology-machine-learning':'Computational biology',
  'programming-biomedical-data-analysis':'Data analysis',
  'introduction-engineering-hands-on':'Hands-on engineering',
};

export const connections=[
  {
    courseId:'research-programming-life-sciences',workId:'vascupath',
    summary:'Explore how scientific programming relates to workflows for large tissue images.',
  },
  {
    courseId:'programming-biomedical-data-analysis',workId:'vascupath',
    summary:'Explore how biomedical data analysis connects with tissue-image processing.',
  },
  {
    courseId:'computational-linear-algebra',workId:'vascupath',
    summary:'Explore the linear-algebra foundations of image representations and model features.',
  },
  {
    courseId:'probability-statistics-data-science',workId:'threshold',
    summary:'Explore the statistical questions involved in evaluating trial-eligibility criteria.',
  },
  {
    courseId:'introduction-machine-learning',workId:'vascupath',
    summary:'Explore machine-learning approaches to detecting vascular features in brain tissue.',
  },
  {
    courseId:'introduction-machine-learning',workId:'symptomai',
    summary:'Explore how machine learning can model patterns across symptom inputs.',
  },
  {
    courseId:'computational-biology-machine-learning',workId:'vascupath',
    summary:'Explore the intersection of biological questions and machine-learning analysis.',
  },
  {
    courseId:'systems-physiology',workId:'symptomai',
    summary:'Explore how physiological systems provide context for understanding symptoms.',
  },
  {
    courseId:'molecular-cell-biology',workId:'vascupath',
    summary:'Explore the cellular context behind patterns observed in brain-tissue images.',
  },
  {
    courseId:'biomedical-measurements-analysis',workId:'bci-motor-rehabilitation',
    summary:'Explore the measurement questions involved in recording biomedical signals.',
  },
  {
    courseId:'biomedical-signals-controls',workId:'bci-motor-rehabilitation',
    summary:'Explore signal-processing concepts relevant to brain–computer interfaces.',
  },
  {
    courseId:'engineering-design-refugee-health',workId:'threshold',
    summary:'Explore how design for health can frame questions of access and inclusion.',
  },
  {
    courseId:'introduction-engineering-hands-on',workId:'threshold',
    summary:'Explore how hands-on engineering can turn a health-access question into an interactive prototype.',
  },
];

// Optional compact names; full course titles remain authoritative in portfolio.mjs.
export const courseLabels={
 'research-programming-life-sciences':'Research Programming',
 'programming-biomedical-data-analysis':'Biomedical Data Analysis',
 'computational-linear-algebra':'Computational Linear Algebra',
 'probability-statistics-data-science':'Probability & Statistics',
 'introduction-machine-learning':'Introduction to ML',
 'computational-biology-machine-learning':'Computational Biology & ML',
 'systems-physiology':'Systems Physiology',
 'molecular-cell-biology':'Molecular & Cell Biology',
 'thermodynamics-statistical-mechanics':'Thermodynamics',
 'biomedical-measurements-analysis':'Measurements & Analysis',
 'biomedical-signals-controls':'Signals & Controls',
 'engineering-design-refugee-health':'Refugee Health Design',
 'introduction-engineering-hands-on':'Hands-On Engineering',
};
