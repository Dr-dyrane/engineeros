/* EngineerOS · Resume Studio assets — coaching content + ATS helpers */

/* Strong action verbs, grouped. Tap to drop into a bullet. */
export const ACTION_VERBS = [
  { group: 'Led', verbs: ['Led', 'Directed', 'Coordinated', 'Managed', 'Spearheaded', 'Mentored', 'Oversaw', 'Chaired'] },
  { group: 'Built', verbs: ['Built', 'Designed', 'Engineered', 'Developed', 'Prototyped', 'Programmed', 'Modeled', 'Automated', 'Fabricated'] },
  { group: 'Improved', verbs: ['Improved', 'Optimized', 'Reduced', 'Increased', 'Streamlined', 'Accelerated', 'Cut', 'Boosted', 'Saved'] },
  { group: 'Analyzed', verbs: ['Analyzed', 'Tested', 'Measured', 'Evaluated', 'Simulated', 'Validated', 'Diagnosed', 'Calculated', 'Researched'] },
  { group: 'Delivered', verbs: ['Delivered', 'Launched', 'Shipped', 'Implemented', 'Deployed', 'Completed', 'Achieved', 'Produced'] },
  { group: 'Communicated', verbs: ['Presented', 'Documented', 'Authored', 'Trained', 'Demonstrated', 'Reported', 'Collaborated'] },
];
export const VERB_SET = new Set(ACTION_VERBS.flatMap(g => g.verbs.map(v => v.toLowerCase())));

/* The bullet formula we coach toward. */
export const XYZ = {
  formula: 'Accomplished [X], measured by [Y], by doing [Z].',
  examples: [
    'Reduced part weight 18% by redesigning the bracket in SolidWorks and validating with FEA.',
    'Built an Arduino sensor rig that cut test-setup time from 2 hours to 15 minutes.',
    'Automated a data-logging script in Python, saving the team ~5 hours per week.',
  ],
};

/* Words ignored when extracting keywords from a job description. */
export const STOPWORDS = new Set(('a an the and or but to of in for with on as at by be is are was were will would should could ' +
  'this that these those we you your our their they it its from into over under out up down off not no yes do does did ' +
  'have has had having can may might must shall i me my mine us them he she his her who whom which what when where why how ' +
  'work working experience experiences team teams ability able strong skill skills role roles candidate candidates ' +
  'looking join joining company companies job jobs position positions responsibility responsibilities requirement ' +
  'requirements preferred plus year years month months including include includes etc using use used new good great ' +
  'excellent ideal you’ll we’re you’re across within while also more most than then them well make made')
  .split(/\s+/));

/* Multi-word / domain skills we want to catch even if tokenization would split them. */
export const SKILL_HINTS = ['machine learning', 'computer vision', 'control systems', 'finite element', 'fea',
  'cad', 'solidworks', 'fusion 360', 'autocad', 'ansys', 'matlab', 'simulink', 'python', 'c++', 'arduino', 'esp32',
  'raspberry pi', 'ros', 'plc', 'embedded', 'microcontroller', 'pcb', 'kicad', 'gd&t', 'cnc', '3d printing',
  'data analysis', 'numpy', 'pandas', 'git', 'linux', 'thermodynamics', 'fluid', 'robotics', 'sensors', 'actuators',
  'manufacturing', 'lean', 'six sigma', 'project management', 'technical writing', 'mechatronics'];
