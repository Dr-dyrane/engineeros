/* EngineerOS · Interview question bank.
   Tailored for a mechanical graduate moving into robotics / AI-enabled roles.
   `star: true` questions open the Situation / Task / Action / Result builder;
   the rest take a single answer. `hint` is a calm nudge, not a script. */

export const INTERVIEW = [
  {
    group: 'Your story',
    items: [
      { id: 'q_walk_project', star: true, q: 'Walk me through your final-year project.',
        hint: 'Pick your strongest project. What was the goal, what did you build, and what changed because of it? Use a real number.' },
      { id: 'q_proud', star: true, q: 'Tell me about a project you are proud of.',
        hint: 'It does not have to be big. Proud usually means you solved something or learned fast.' },
      { id: 'q_switch', star: false, q: 'Why are you moving from mechanical into robotics and AI?',
        hint: 'Honest and specific beats grand. What pulled you in, and what have you already done about it?' },
    ],
  },
  {
    group: 'How you work',
    items: [
      { id: 'q_hard', star: true, q: 'Describe a time you solved a hard problem.',
        hint: 'Show the thinking, not just the answer. What did you try, and how did you know it worked?' },
      { id: 'q_team', star: true, q: 'Tell me about working in a team, or handling a disagreement.',
        hint: 'What was your part, what did you do when views differed, and what was the outcome?' },
      { id: 'q_mistake', star: true, q: 'Tell me about a time you failed or made a mistake.',
        hint: 'Own it plainly, then show what you changed. That is what they are listening for.' },
      { id: 'q_learn', star: false, q: 'What are you learning right now, and how?',
        hint: 'Name the resource and the last thing you built with it. Curiosity is a signal.' },
    ],
  },
  {
    group: 'Robotics and engineering',
    items: [
      { id: 'q_debug_robot', star: false, q: 'A robot is powered on but not moving. How do you debug it?',
        hint: 'Think out loud in layers: power, wiring, signal, code. Narrate how you would isolate it.' },
      { id: 'q_pid', star: false, q: 'Explain a control loop or PID in simple terms.',
        hint: 'Use an everyday analogy (a thermostat, steering). Clear beats fancy.' },
      { id: 'q_sensor', star: false, q: 'How do you choose a sensor for a task?',
        hint: 'What are you measuring, how accurate, how fast, what does it cost and draw? Tie it to a real project.' },
      { id: 'q_arduino', star: true, q: 'Tell me about something you built with Arduino or Python.',
        hint: 'A small, real thing you can demo or link to lands better than a big idea you did not finish.' },
    ],
  },
  {
    group: 'AI as a tool',
    items: [
      { id: 'q_ai_tools', star: false, q: 'How have you used AI tools in your engineering work?',
        hint: 'Show judgment: where they helped, and how you checked their output. Employers like careful users.' },
      { id: 'q_ai_verify', star: false, q: 'How do you make sure an AI answer is correct before you trust it?',
        hint: 'This is a strength for you. Talk about verifying against a datasheet, a test, or first principles.' },
    ],
  },
  {
    group: 'Fit and motivation',
    items: [
      { id: 'q_why_us', star: false, q: 'Why this role, and why us?',
        hint: 'One specific thing about them plus one honest thing about you. Do a little homework first.' },
      { id: 'q_future', star: false, q: 'Where do you see yourself in two years?',
        hint: 'Show direction, not a title. What do you want to be good at, and why here.' },
      { id: 'q_questions', star: false, q: 'What questions do you have for us?',
        hint: 'Always have two ready. Ask about the work, the team, or how they grow juniors.' },
    ],
  },
];

/* Flat lookup for counting and rendering. */
export const INTERVIEW_QS = INTERVIEW.flatMap(g => g.items);
