import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import {
  addReflection,
  advanceAll,
  advanceTableStep,
  catchUpTable,
  createInitialState,
  frontSlideImage,
  frontStep,
  helpQueue,
  liveTabs,
  pauseTable,
  previousAll,
  previousTableStep,
  selectNextTable,
  selectPreviousTable,
  selectTable,
  selectedTable,
  tableStep,
  updateTable,
} from "./pacepalModel.mjs";
import "./styles.css";

function cloneState(state) {
  return {
    ...state,
    activity: {
      ...state.activity,
      steps: state.activity.steps.map((step) => ({ ...step })),
      fastTasks: [...state.activity.fastTasks],
    },
    frontScreen: { ...state.frontScreen },
    tables: state.tables.map((table) => ({ ...table })),
    reflections: [...state.reflections],
  };
}

function mutate(setState, action) {
  setState((state) => {
    const next = cloneState(state);
    action(next);
    return next;
  });
}

const tableStatuses = [
  { id: "needs-help", label: "Needs help" },
  { id: "on-track", label: "On track" },
  { id: "fast", label: "Fast" },
];

function App() {
  const [state, setState] = useState(createInitialState);
  const stageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".system-board, .phone-shell", { y: 16, opacity: 0, duration: 0.42, stagger: 0.08, ease: "power3.out" });
      gsap.from(".app-card", { y: 10, opacity: 0, duration: 0.25, stagger: 0.025, ease: "power2.out" });
    }, stageRef);
    return () => ctx.revert();
  }, []);

  return (
    <main className="demo-stage" ref={stageRef}>
      <section className="system-board" aria-label="Room display and table tablets">
        <FrontScreenPreview state={state} />
        <TableTabletGrid state={state} setState={setState} />
      </section>

      <PhoneController state={state} setState={setState} />
    </main>
  );
}

function FrontScreenPreview({ state }) {
  return (
    <section className="front-screen-block">
      <p className="kicker front-screen-label">Front screen</p>
      <div className="front-screen-preview">
        <img src={frontSlideImage(state)} alt="Actual phone charm slide on the front screen" />
      </div>
    </section>
  );
}

function TableTabletGrid({ state, setState }) {
  return (
    <div className="tablet-grid">
      {state.tables.map((table) => {
        const step = tableStep(state, table.id);
        return (
          <section className="tablet-preview" key={table.id}>
            <p className="kicker tablet-preview-label">{table.name}</p>
            <button
              type="button"
              className={`tablet-slide-card ${state.selectedTableId === table.id ? "selected" : ""}`}
              onClick={() => mutate(setState, (draft) => selectTable(draft, table.id))}
              aria-label={`${table.name} slide preview`}
            >
              <img src={step.slideImage} alt={`${table.name} actual phone charm slide`} />
            </button>
          </section>
        );
      })}
    </div>
  );
}

function PhoneController({ state, setState }) {
  const queue = helpQueue(state);
  const screenBodyRef = useRef(null);
  const screenPanelRef = useRef(null);
  const previousTabRef = useRef(state.activeTab);

  useEffect(() => {
    const previousIndex = liveTabs.indexOf(previousTabRef.current);
    const nextIndex = liveTabs.indexOf(state.activeTab);
    const direction = nextIndex >= previousIndex ? 1 : -1;
    const ctx = gsap.context(() => {
      gsap.fromTo(".screen-panel",
        { x: direction * 18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.22, ease: "power2.out" },
      );
    }, screenBodyRef);
    previousTabRef.current = state.activeTab;
    return () => ctx.revert();
  }, [state.activeTab]);

  return (
    <section className="phone-wrap" aria-label="Volunteer phone app">
      <div className="phone-shell">
        <div className="phone-screen">
          <header className="app-header">
            <div>
              <span>Fei Yue AAC</span>
              <strong>{state.activeActivity}</strong>
            </div>
          </header>

          <nav className="tab-bar four-tabs" aria-label="Volunteer screens">
            {liveTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={state.activeTab === tab ? "active" : ""}
                onClick={() => setState((current) => ({ ...current, activeTab: tab }))}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="screen-body" ref={screenBodyRef}>
            <div className="screen-panel" key={state.activeTab} ref={screenPanelRef}>
              {state.activeTab === "slide" && <SlideControlScreen state={state} setState={setState} />}
              {state.activeTab === "help" && <HelpScreen state={state} setState={setState} queue={queue} />}
              {state.activeTab === "review" && <ReviewScreen state={state} setState={setState} />}
              {state.activeTab === "tablets" && <TablesScreen state={state} setState={setState} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TablesScreen({ state, setState }) {
  const table = selectedTable(state);
  const step = tableStep(state);

  return (
    <section className="screen-stack">
      <div className="app-card follow-list">
        <p className="kicker">Front screen follow status</p>
        {state.tables.map((item) => (
          <div className="follow-row" key={item.id}>
            <strong>{item.name}</strong>
            <span>{item.following ? "Following" : "Paused"}</span>
            <button
              type="button"
              onClick={() => mutate(setState, (draft) => {
                if (item.following) pauseTable(draft, item.id);
                else catchUpTable(draft, item.id);
              })}
            >
              {item.following ? "Pause" : "Catch up"}
            </button>
          </div>
        ))}
      </div>

      <div className="app-card current-step">
        <div className="card-row">
          <p className="kicker">{table.name}</p>
          <span>Slide {table.stepIndex + 1}/{state.activity.totalSteps}</span>
        </div>
        <img className="phone-slide-image" src={step.slideImage} alt={`${table.name} actual slide`} />
        <small>{step.cue}</small>
        <div className="table-status">
          <p className="kicker">Table status</p>
          <div className="status-row">
            {tableStatuses.map((status) => (
              <button
                key={status.id}
                type="button"
                className={`status-choice ${status.id} ${table.status === status.id ? "selected" : ""}`}
                onClick={() => mutate(setState, (draft) => updateTable(draft, table.id, status.id))}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
        {table.status === "needs-help" && (
          <label className="help-remark">
            <span className="kicker">Help remark</span>
            <input
              type="text"
              value={table.note}
              placeholder="String tip too soft"
              onChange={(event) => mutate(setState, (draft) => {
                const draftTable = draft.tables.find((item) => item.id === table.id);
                if (draftTable) draftTable.note = event.target.value;
              })}
            />
          </label>
        )}
        <div className="button-row">
          <button type="button" onClick={() => mutate(setState, previousTableStep)}>Last slide</button>
          <button type="button" className="primary" onClick={() => mutate(setState, advanceTableStep)}>Next slide</button>
        </div>
      </div>

      <div className="button-row tablet-nav-row app-card">
        <button type="button" onClick={() => mutate(setState, selectPreviousTable)}>Last tablet</button>
        <button type="button" onClick={() => mutate(setState, selectNextTable)}>Next tablet</button>
      </div>

    </section>
  );
}

function SlideControlScreen({ state, setState }) {
  const master = frontStep(state);

  return (
    <section className="screen-stack">
      <div className="app-card master-control">
        <div className="card-row">
          <p className="kicker">Front screen</p>
          <span>Slide {state.frontStepIndex + 1}/{state.activity.totalSteps}</span>
        </div>
        <img className="phone-slide-image" src={master.slideImage} alt="Front screen slide" />
        <div className="button-row">
          <button type="button" onClick={() => mutate(setState, previousAll)}>Back all</button>
          <button type="button" className="primary" onClick={() => mutate(setState, advanceAll)}>Next all</button>
        </div>
      </div>
    </section>
  );
}

function HelpScreen({ state, setState, queue }) {
  return (
    <section className="screen-stack">
      <p className="kicker">Help queue</p>
      {queue.length ? queue.map((table) => (
        <div className="app-card queue-card" key={table.id}>
          <span>{table.name}</span>
          <strong>{table.note}</strong>
          <button type="button" onClick={() => mutate(setState, (draft) => updateTable(draft, table.id, "helped"))}>
            Mark helped
          </button>
        </div>
      )) : <div className="app-card"><p>No help requests right now.</p></div>}
    </section>
  );
}

function ReviewScreen({ state, setState }) {
  const [draft, setDraft] = useState("Tablet screens helped slower seniors stay with the small steps.");

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="kicker">Review</p>
        <h2>Record confusing steps for the next session.</h2>
      </div>
      <form
        className="app-card log-form"
        onSubmit={(event) => {
          event.preventDefault();
          mutate(setState, (next) => addReflection(next, draft));
          setDraft("");
        }}
      >
        <label htmlFor="reflection">Observation</label>
        <textarea id="reflection" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit" className="primary">Save note</button>
      </form>
      <div className="app-card">
        <p className="kicker">Saved notes</p>
        {state.reflections.length ? (
          <ul className="task-list">
            {state.reflections.map((note) => <li key={note}>{note}</li>)}
          </ul>
        ) : (
          <p>No notes saved yet.</p>
        )}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
