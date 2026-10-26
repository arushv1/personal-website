// ============================================================
// EDIT THIS FILE TO CHANGE THE SITE CONTENT.
// You do not need to touch layout code in src/app or src/components.
// Anything marked "To add" is a placeholder for Arush to fill in.
// Writing rule for this site: never use em dashes in copy.
// ============================================================

export const site = {
  name: "Arush Vyas",
  monogram: "AV",
  status: "BU Biomedical Engineering, Class of 2027",
  location: "Brookline / Boston, MA",
  availability: "Seeking entry level AI/ML roles, starting 2027",
  email: "arushv16@gmail.com",
  linkedin: "https://www.linkedin.com/in/arush-vyas",
  github: "https://github.com/arushv1",
};

export const intro = {
  // To add: Arush's own tagline, one line, in his voice.
  tagline: "To add: tagline",
  headline: "Medical imaging AI, built to be trusted.",
  subhead:
    "I work on models that clinicians and researchers can actually evaluate: segmentation that holds up on real scans, foundation models adapted to real tissue, and evaluations that say where a model fails, not just how it scores.",
  // To add: a headshot image file in public/ and its path here.
  headshot: "To add: headshot image (place the file in public/ and put its path here)",
};

export const about = {
  heading: "About",
  // To add: Arush's own About paragraphs.
  paragraphs: [
    "To add: About paragraph 1. Who you are, and what draws you to medical imaging AI.",
    "To add: About paragraph 2. How you work, and what you are looking for next.",
  ],
  facts: [
    { label: "Degree", value: "BS Biomedical Engineering, Boston University, expected May 2027" },
    { label: "GPA", value: "3.83" },
    { label: "Focus", value: "Medical imaging AI, foundation models, segmentation, evaluation" },
    { label: "Base", value: "Brookline / Boston, MA" },
  ],
  // To add: what Arush is looking for next, in his own words.
  lookingFor: "To add: what you are looking for next",
};

export type Award = {
  title: string;
  detail: string;
  size: "large" | "medium" | "small";
};

export const awards: Award[] = [
  {
    title: "2026 Undergraduate Convergent Research Award",
    detail: "Health Across the Lifespan track, for the VascuPath research",
    size: "large",
  },
  {
    title: "2nd Place, Health and Biotech Hack",
    detail: "Boston University DS + X Hackathon, October 2026",
    size: "medium",
  },
  {
    title: "3rd Place, Early-Stage Lung Cancer Phenotyping",
    detail: "MedAI Hackathon, Boston University, April 2026",
    size: "medium",
  },
  {
    title: "Harold C. Case Merit Scholarship",
    detail: "For academic excellence, Boston University, 2026",
    size: "small",
  },
  {
    title: "UROP Symposium presentation",
    detail: "Presented the VascuPath research at Boston University",
    size: "small",
  },
];

export type Project = {
  id: string;
  giantWord: string;
  role: string;
  org: string;
  period: string;
  summary: string;
  bullets: string[];
  tags: string[];
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    id: "boston-scientific",
    giantWord: "VESSELS",
    role: "Health AI Engineering Intern",
    org: "Boston Scientific",
    period: "May 2026 to present",
    summary:
      "An internal 3D CTA segmentation pipeline for a vascular therapies AI medical imaging product, distinguishing artery classes across scans.",
    bullets: [
      "Mean artery Dice 0.87, clDice 0.94.",
      "Benchmarked 10+ model variants across loss functions, attention mechanisms, and foundation model fine tuning.",
      "Vessel specific objectives and attention gates drove a +0.22 Dice gain over the baseline model.",
      "Co-inventor of patent pending medical imaging technology.",
      "Presented technical findings, model performance, and product impact to directors and executive leadership.",
    ],
    tags: ["3D CTA", "Segmentation", "PyTorch", "Foundation models"],
    links: [],
  },
  {
    id: "vascupath",
    giantWord: "SLIDES",
    role: "Undergraduate Deep Learning Researcher",
    org: "Tian Lab, Boston University",
    period: "September 2025 to present",
    summary:
      "VascuPath segments gigapixel scale whole slide images to detect and quantify vascular changes in CTE and Alzheimer's tissue, automating analysis that takes neuropathologists hours by hand.",
    bullets: [
      "Curating 2,500+ annotated tissue patches from 40+ whole slide images, plus a diagnosis manifest of 760+ WSIs.",
      "Introduced QuPath multi-resolution viewing with Groovy scripted tile extraction, cutting curation to minutes per slide.",
      "One multi-head model on a neuropathology ViT-L foundation backbone replaced three separately trained networks.",
      "99.6% stain classification and 96.7% vessel detection accuracy on 500 test patches from brightfield H&E slides.",
      "Per-slide inference cut 70%, from 5 to 6 minutes to 1 to 2 minutes, through a shared embedding.",
      "Weakly supervised attention based MIL model: held out AUCs 0.92 for repetitive head impact, 0.91 for CTE, 0.94 for high-stage Alzheimer's.",
      "Manuscript planned on this research.",
    ],
    tags: ["Whole slide imaging", "VascuPath", "QuPath", "ViT-L"],
    links: [
      // To add: real links when available.
      { label: "To add: manuscript link", href: "#" },
      { label: "To add: poster link", href: "#" },
    ],
  },
  {
    id: "btec",
    giantWord: "ANSWERS",
    role: "Lab Assistant",
    org: "BTEC Lab, Boston University",
    period: "September 2025 to present",
    summary:
      "An AI knowledge base for the lab assistant team, built around one question: can the people who rely on it trust what comes back?",
    bullets: [
      "Proposed the knowledge base after noticing assistants losing time searching protocols, instrument docs, and inventory info.",
      "Took over an existing retrieval system and implemented it for BTEC, and now maintains and improves it.",
      "Covers 1,800+ documents across 12 subject areas, used by 13 assistants.",
      "Benchmarked language models on a 30-question test set drawn from real assistant queries.",
      "Improved retrieval precision by filtering outdated files, grouping near duplicates, and tuning ranking.",
      "Replaced a dedicated hosted server with a serverless pipeline pulling documents directly from Google Drive.",
      "Trained 20+ students on core biomedical instruments, including the gel imager, bioprinter, SpectraMax plate reader, and qPCR.",
    ],
    tags: ["RAG", "LLM evaluation", "Serverless", "Google Drive"],
    links: [],
  },
  {
    id: "threshold",
    giantWord: "TRIALS",
    role: "Project",
    org: "Threshold",
    period: "October 2026",
    summary:
      "An eligibility linter and patient trial matcher covering 1,011 recruiting Massachusetts cancer trials, showing which communities restrictive criteria exclude.",
    bullets: [
      "Combined ClinicalTrials.gov, CDC PLACES, and MassGIS environmental justice data.",
      "LLM extraction pipeline with a forced tool use schema over 13 categories extracted 3,839 restrictions, verified word for word against source text.",
      "Reached 0.97 precision and 0.94 F1, 0.95 held out, on 42 human labeled trials.",
    ],
    tags: ["TypeScript", "Next.js", "Claude API", "pytest"],
    links: [
      // To add: real links when available.
      { label: "To add: Threshold demo link", href: "#" },
      { label: "To add: Threshold repo link", href: "#" },
    ],
  },
];

export const researchInterests = [
  "Foundation models for medical imaging, pretrained on domain specific data",
  "Segmentation and detection on 3D volumes and 2D tissue images",
  "Evaluation and reliability: benchmarking, failure analysis, and validation that survives contact with real data",
  "Clinical AI that produces evidence clinicians can evaluate and act on",
];

export const publication = {
  citation:
    "Vyas, A., Bansal, K., et al. Optimizing Non-Invasive Brain-Computer Interfaces for Motor Rehabilitation in Individuals with Spinal Cord Injury. STEM Students on the Rise, Rice University, October 2025.",
  link: "https://dx.doi.org/10.2139/ssrn.5605290",
};

export const interlude = {
  heading: "Between the slides",
  // To add: a short personal note, a photo, or a detail Arush wants visitors to know.
  text: "To add: a personal note or photo for this interlude section.",
};

export const contact = {
  heading: "Start a conversation",
  text: "If you are building medical imaging AI and care about evaluation as much as accuracy, I would like to hear from you.",
  // To add: Arush's contact preferences, for example preferred channel or response time.
  preferences: "To add: contact preferences",
  // To add: a resume PDF in public/ and its path here, for the download button.
  resumeDownload: "To add: resume PDF download (place the file in public/ and put its path here)",
};
