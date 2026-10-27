// Edit items here to add content. No component or navigation edits are needed.
// Copy an existing item, give it a stable unique id, and keep text as plain strings.
export const sections = [
  {
    id:'about', label:'About Me', eyebrow:'THE PERSON', title:'About Me',
    intro:'Biomedical engineering, medical imaging, and a curiosity for how things work.',
    region:'Face', anchor:[0,.75,1], callout:{side:'left',rank:1},
    view:{position:[.15,1.35,6.6],target:[0,.75,0],reveal:0},
    items:[
      {id:'at-a-glance',title:'Hi, I’m Arush.',subtitle:'Bay Area roots · Boston, MA',summary:'I’m a biomedical engineering student at Boston University, working at the intersection of medical imaging and AI.',body:['My work connects tissue-scale patterns, three-dimensional vascular imaging, and the questions behind useful clinical tools.']},
      {id:'outside-the-lab',title:'Outside the lab',subtitle:'Building · Tinkering · Other worlds',summary:'I’ve loved making things since childhood, starting with LEGO and continuing through projects and computer setups.',body:['Often adjusting a desk setup, trying another configuration, or exploring a story-driven game. Ghost of Tsushima, Onimusha, and Assassin’s Creed are on my shelf.']},
    ],
  },
  {
    id:'education',label:'Education',eyebrow:'FOUNDATIONS',title:'Education',
    intro:'The foundations behind the questions I’m learning to ask.',
    region:'Cortex',anchor:[-.42,1.35,.15],callout:{side:'right',rank:0},
    view:{position:[-3.7,2.2,4.9],target:[0,1,0],reveal:100},
    items:[{id:'boston-university',title:'Boston University',subtitle:'BS, Biomedical Engineering',period:'Expected May 2027',summary:'Undergraduate study in biomedical engineering in Boston, Massachusetts.',facts:[['GPA','3.83'],['Degree','Bachelor of Science']],body:['Connecting engineering, computation, and biomedical questions through research and applied projects.']}],
  },
  {
    id:'experience',label:'Experience',eyebrow:'IN PRACTICE',title:'Experience',
    intro:'Research, engineering, and the work of turning ideas into useful tools.',
    region:'Vascular tree',anchor:[-.5,.2,.35],callout:{side:'left',rank:2},
    view:{position:[3.6,1.2,4.7],target:[0,.6,0],reveal:68},
    items:[
      {id:'boston-scientific',title:'Boston Scientific',subtitle:'Health AI Engineering Intern',period:'May 2026 – Present',summary:'Building and evaluating 3D CTA segmentation for vascular-therapies medical imaging.',tags:['Medical imaging','Deep learning','CTA'],highlights:['Developed a segmentation pipeline reaching mean artery Dice 0.87 and clDice 0.94.','Benchmarked model variants, loss functions, attention mechanisms, and foundation-model fine-tuning.','Co-invented patent-pending imaging technology and presented technical findings to leadership.']},
      {id:'tian-lab',title:'Tian Lab',subtitle:'Undergraduate Deep Learning Researcher',period:'September 2025 – Present',summary:'Computational imaging research on vascular features in brain tissue.',tags:['Histopathology','QuPath','Whole-slide imaging'],highlights:['Curating 2,500+ annotated tissue patches from 40+ whole-slide images and a diagnosis manifest of 760+ slides.','Introduced multi-resolution viewing and scripted tile extraction to streamline dataset curation.']},
      {id:'btec',title:'BTEC',subtitle:'Lab Assistant · Boston University',period:'September 2025 – Present',summary:'Supporting the Bioengineering Technology & Entrepreneurship Center with retrieval tools and research resources.',tags:['RAG','Knowledge systems','Evaluation'],highlights:['Maintain a retrieval knowledge base spanning 1,800+ documents across 12 subject areas.','Prepare resources for retrieval and benchmark answer accuracy against real assistant queries.']},
    ],
  },
  {
    id:'projects',label:'Projects',eyebrow:'THINGS I BUILD',title:'Projects',
    intro:'Different problems, shared curiosity. Explore the work one project at a time.',
    region:'Frontal cortex',anchor:[.42,1.2,.62],callout:{side:'right',rank:1},
    view:{position:[-1.8,1.8,5.3],target:[0,1,.15],reveal:100},
    items:[
      {id:'symptomai',title:'SymptomAI',subtitle:'Symptom-based disease prediction',period:'October 2025',summary:'Exploring overlapping symptoms and the challenge of distinguishing between possible conditions.',tags:['Python','Flask','React','PyTorch'],body:['A disease prediction system that takes symptom inputs and returns the three most likely conditions. A convolutional neural network models interactions across symptoms.'],highlights:['Designed around 328 symptom inputs and 773 disease classes.','Built a model-training and prediction workflow with GPU acceleration and early stopping.']},
      {id:'threshold',title:'Threshold',subtitle:'Clinical trial eligibility and access',period:'October 2026',summary:'An eligibility linter and patient-trial matcher that makes restrictive criteria easier to examine.',tags:['Python','TypeScript','Next.js','Claude API'],body:['Combines ClinicalTrials.gov, CDC PLACES, and MassGIS environmental-justice data to explore which communities trial criteria may exclude.'],highlights:['Covers 1,011 recruiting Massachusetts cancer trials.','Extracted 3,839 restrictions and verified them word for word against source text.','Evaluated against human-labeled trials, with 0.97 precision and 0.94 F1.']},
      {id:'vascupath',title:'VascuPath',subtitle:'Vascular features in brain tissue',period:'January 2026 – Present',summary:'An AI pipeline for detecting and quantifying vascular changes in gigapixel brain slides.',tags:['PyTorch','QuPath','OpenSlide','MLflow'],body:['A shared neuropathology foundation backbone feeds stain and vessel prediction heads, supporting feature extraction across hundreds of slides.'],highlights:['Reached 99.6% stain classification and 96.7% vessel detection accuracy on 500 test patches.','Reduced per-slide inference time from 5–6 minutes to 1–2 minutes.','Built attention-based multiple-instance learning models for disease-pattern analysis.']},
    ],
  },
  {
    id:'awards',label:'Awards',eyebrow:'MILESTONES',title:'Awards',
    intro:'Recognition for research, building, and learning alongside others.',
    region:'Crown of the skull',anchor:[.1,1.65,-.05],callout:{side:'left',rank:0},
    view:{position:[.4,3.1,5.8],target:[0,1,0],reveal:34},
    items:[
      {id:'health-biotech-hack',title:'Health and Biotech Hack',subtitle:'2nd Place · BU DS + X Hackathon',period:'October 2026',summary:'Second place in the Health and Biotech Hack.'},
      {id:'urop-poster',title:'UROP Symposium Poster Award',subtitle:'Convergent Research · Health Across the Lifespan',period:'2026',summary:'One of four inaugural Convergent Research Poster Award winners.'},
      {id:'urop-research',title:'Student Research Awards',subtitle:'Boston University UROP',period:'2025 & 2026',summary:'Two-time recipient of a Student Research Award from BU’s Undergraduate Research Opportunities Program.'},
      {id:'harold-case',title:'Harold C. Case Merit Scholarship',subtitle:'Academic excellence · Boston University',period:'2026',summary:'One of 15 selected recipients.'},
      {id:'medai',title:'MedAI Hackathon',subtitle:'3rd Place · Early-Stage Lung Cancer Phenotyping',period:'April 2026',summary:'Third place in the early-stage lung cancer phenotyping track at Boston University.'},
    ],
  },
  {
    id:'courses',label:'Courses',eyebrow:'CONTINUING TO LEARN',title:'Courses',
    intro:'A place for coursework, ideas, and the connections between them.',
    region:'Cervical spine',anchor:[0,-.35,-.3],callout:{side:'left',rank:3},
    view:{position:[-4.7,.9,-2.8],target:[0,.3,0],reveal:34},
    items:[],empty:'Selected coursework will appear here.',
  },
  {
    id:'publications',label:'Publications',eyebrow:'SHARED IDEAS',title:'Publications',
    intro:'Writing and research shared beyond the lab.',
    region:'Posterior cortex',anchor:[.2,1.05,-.75],callout:{side:'right',rank:2},
    view:{position:[2.4,1.8,-5.4],target:[0,1,0],reveal:100},
    items:[{id:'bci-motor-rehabilitation',navTitle:'Brain–computer interfaces',title:'Optimizing Non-Invasive Brain-Computer Interfaces for Motor Rehabilitation in Individuals with Spinal Cord Injury',subtitle:'Vyas, A., Bansal, K., et al.',period:'October 2025',summary:'STEM Students on the Rise, Rice University.',links:[{label:'Read on SSRN',href:'https://doi.org/10.2139/ssrn.5605290'}]}],
  },
];
export const sectionById=Object.fromEntries(sections.map(section=>[section.id,section]));
export const overviewView={position:[2.1,1.6,7.4],target:[0,.8,0],reveal:100};
