export const liveTabs = ["tablets", "slide", "help", "review"];

export const languageLabels = {
  english: "English",
  mandarin: "中文",
};

const activity = {
  name: "Phone Charm",
  totalSteps: 46,
  steps: [
    {
      title: "Choose beads",
      english: "Choose 6 beads for your initials and colour combination.",
      mandarin: "选择六颗珠子，搭配名字缩写和颜色。",
      cue: "Help seniors separate small beads before tying begins.",
      slideImage: "/slides/beads-05.jpg",
    },
    {
      title: "Make a loop",
      english: "Make a loop and make sure both ends are equal.",
      mandarin: "做一个圈，并确保两边长度一样。",
      cue: "Check seniors who grip the string too tightly.",
      slideImage: "/slides/beads-06.jpg",
    },
    {
      title: "Wrap around finger",
      english: "Make a loop around your finger.",
      mandarin: "绕着手指做一个圈。",
      cue: "Demonstrate slowly with a large sample string.",
      slideImage: "/slides/beads-07.jpg",
    },
    {
      title: "Pull cotton loop through",
      english: "Carefully take out the loop and put the cotton loop through.",
      mandarin: "小心取出圈圈，并把棉线圈穿过去。",
      cue: "Watch for seniors losing the loop shape.",
      slideImage: "/slides/beads-08.jpg",
    },
    {
      title: "Tighten the knot",
      english: "Pull to tighten the knot.",
      mandarin: "拉紧绳结。",
      cue: "Check the knot before letting seniors continue.",
      slideImage: "/slides/beads-09.jpg",
    },
  ],
  fastTasks: ["Decorate a name tag.", "Choose colours for a second charm.", "Help a peer after a volunteer checks the knot."],
};

export function createInitialState() {
  return {
    activeActivity: activity.name,
    activeTab: "tablets",
    selectedTableId: 1,
    frontStepIndex: 1,
    language: "english",
    activity: {
      ...activity,
      steps: activity.steps.map((step) => ({ ...step })),
      fastTasks: [...activity.fastTasks],
    },
    frontScreen: {
      title: "Phone Charm Workshop",
      checkpoint: "Checkpoint 2: Add first beads",
      reminder: "Keep both string ends even before moving on.",
      nextCue: "Next whole-room cue: knot check",
      slideImage: "/slides/beads-01.jpg",
    },
    tables: [
      { id: 1, name: "Tablet 1", status: "needs-help", following: true, stepIndex: 1, note: "String tip too soft" },
      { id: 2, name: "Tablet 2", status: "on-track", following: true, stepIndex: 1, note: "Threading beads" },
      { id: 3, name: "Tablet 3", status: "fast", following: false, stepIndex: 3, note: "Ready for extension" },
    ],
    reflections: [],
  };
}

export function selectedTable(state) {
  return state.tables.find((table) => table.id === state.selectedTableId) || state.tables[0];
}

export function selectTable(state, id) {
  if (state.tables.some((table) => table.id === id)) state.selectedTableId = id;
  return selectedTable(state);
}

export function selectNextTable(state) {
  const index = state.tables.findIndex((table) => table.id === state.selectedTableId);
  const next = state.tables[(index + 1) % state.tables.length];
  return selectTable(state, next.id);
}

export function selectPreviousTable(state) {
  const index = state.tables.findIndex((table) => table.id === state.selectedTableId);
  const previous = state.tables[(index - 1 + state.tables.length) % state.tables.length];
  return selectTable(state, previous.id);
}

export function tableStep(state, id = state.selectedTableId) {
  const table = state.tables.find((item) => item.id === id) || selectedTable(state);
  return state.activity.steps[Math.min(table.stepIndex, state.activity.steps.length - 1)];
}

export function frontStep(state) {
  return state.activity.steps[Math.min(state.frontStepIndex, state.activity.steps.length - 1)];
}

export function frontSlideImage(state) {
  return frontStep(state).slideImage;
}

export function currentInstruction(state) {
  return tableStep(state)[state.language];
}

export function advanceTableStep(state, id = state.selectedTableId) {
  const table = state.tables.find((item) => item.id === id);
  if (table) table.stepIndex = Math.min(state.activity.steps.length - 1, table.stepIndex + 1);
  return tableStep(state, id);
}

export function previousTableStep(state, id = state.selectedTableId) {
  const table = state.tables.find((item) => item.id === id);
  if (table) table.stepIndex = Math.max(0, table.stepIndex - 1);
  return tableStep(state, id);
}

export function advanceAll(state) {
  state.frontStepIndex = Math.min(state.activity.steps.length - 1, state.frontStepIndex + 1);
  state.tables.forEach((table) => {
    if (table.following) table.stepIndex = state.frontStepIndex;
  });
  return frontStep(state);
}

export function previousAll(state) {
  state.frontStepIndex = Math.max(0, state.frontStepIndex - 1);
  state.tables.forEach((table) => {
    if (table.following) table.stepIndex = state.frontStepIndex;
  });
  return frontStep(state);
}

export function pauseTable(state, id = state.selectedTableId) {
  const table = state.tables.find((item) => item.id === id);
  if (table) table.following = false;
  return table;
}

export function catchUpTable(state, id = state.selectedTableId) {
  const table = state.tables.find((item) => item.id === id);
  if (table) {
    table.stepIndex = state.frontStepIndex;
    table.following = true;
  }
  return table;
}

export function setLanguage(state, language) {
  if (languageLabels[language]) state.language = language;
  return currentInstruction(state);
}

export function updateTable(state, id, status) {
  const table = state.tables.find((item) => item.id === id);
  if (table) table.status = status;
  return table;
}

export function helpQueue(state) {
  return state.tables.filter((table) => table.status === "needs-help");
}

export function addReflection(state, note) {
  const text = String(note || "").trim();
  if (text) state.reflections.push(text);
  return state.reflections;
}
