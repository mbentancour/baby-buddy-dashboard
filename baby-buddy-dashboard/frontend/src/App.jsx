import { useState } from "react";
import { useBabyData } from "./hooks/useBabyData";
import { useTimers } from "./hooks/useTimers";
import { Icons } from "./components/Icons";
import { colors } from "./utils/colors";
import { getAge, formatElapsed } from "./utils/formatters";
import OverviewTab from "./tabs/OverviewTab";
import GrowthTab from "./tabs/GrowthTab";
import FeedingForm from "./components/forms/FeedingForm";
import SleepForm from "./components/forms/SleepForm";
import DiaperForm from "./components/forms/DiaperForm";
import TemperatureForm from "./components/forms/TemperatureForm";
import TummyTimeForm from "./components/forms/TummyTimeForm";
import NoteForm from "./components/forms/NoteForm";
import WeightForm from "./components/forms/WeightForm";
import HeightForm from "./components/forms/HeightForm";
import TimerButton from "./components/TimerButton";
import "./styles.css";

const TABS = [
  { id: "overview", label: "Overview", icon: <Icons.Activity /> },
  { id: "growth", label: "Growth", icon: <Icons.TrendUp /> },
];

const ACTION_GROUPS = [
  {
    label: "Track",
    actions: [
      { id: "feeding", label: "Feeding", icon: <Icons.Bottle />, color: colors.feeding },
      { id: "sleep", label: "Sleep", icon: <Icons.Moon />, color: colors.sleep },
      { id: "diaper", label: "Diaper", icon: <Icons.Droplet />, color: colors.diaper },
      { id: "tummy", label: "Tummy", icon: <Icons.Sun />, color: colors.tummy },
    ],
  },
  {
    label: "Measure",
    actions: [
      { id: "temp", label: "Temp", icon: <Icons.Temp />, color: colors.temp },
      { id: "weight", label: "Weight", icon: <Icons.Weight />, color: colors.growth },
      { id: "height", label: "Height", icon: <Icons.Ruler />, color: colors.height },
    ],
  },
  {
    label: "Note",
    actions: [
      { id: "note", label: "Note", icon: <Icons.Heart />, color: "#EC4899" },
    ],
  },
];

const TIMER_TYPES = [
  { id: "feeding", label: "Feeding", icon: <Icons.Bottle />, color: colors.feeding },
  { id: "sleep", label: "Sleep", icon: <Icons.Moon />, color: colors.sleep },
  { id: "tummy", label: "Tummy Time", icon: <Icons.Sun />, color: colors.tummy },
];

function timerNameToType(name) {
  if (!name) return "feeding";
  const n = name.toLowerCase();
  if (n.includes("sleep")) return "sleep";
  if (n.includes("tummy")) return "tummy";
  return "feeding";
}

export default function App() {
  const data = useBabyData();
  const timer = useTimers(data.timers, data.child?.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState("Track");
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  const closeModal = () => setModal(null);
  const handleFormDone = () => {
    closeModal();
    data.refetch();
  };

  if (data.loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="avatar">
            {data.child?.picture ? (
              <img src={data.child.picture} alt={data.child.first_name} className="avatar-img" />
            ) : (
              <Icons.Baby />
            )}
          </div>
          <div>
            <h1 className="baby-name">
              {data.child?.first_name || "Baby"}
            </h1>
            {data.child?.birth_date && (
              <span className="baby-age">{getAge(data.child.birth_date)}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data.error && (
            <span className="sync-error">Connection error</span>
          )}
          {data.lastSync && !data.error && (
            <span className="sync-time">
              {data.lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="refresh-btn" onClick={data.refetch} title="Refresh">
            <Icons.Activity />
          </button>
        </div>
      </header>

      {/* Active Timer Bars */}
      {timer.activeTimers.map((t) => (
        <div key={t.id} className="timer-bar fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="timer-pulse" />
            <Icons.Timer />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {t.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="timer-elapsed">{formatElapsed(timer.elapsedMap[t.id] || 0)}</span>
            <button
              className="timer-save-btn"
              onClick={async () => {
                const stopped = await timer.stopTimer(t.id);
                if (stopped) {
                  setModal({ type: timerNameToType(stopped.name), timerId: stopped.id });
                }
              }}
            >
              Save
            </button>
            <button
              className="timer-discard-btn"
              onClick={() => timer.discardTimer(t.id)}
            >
              <Icons.X />
            </button>
          </div>
        </div>
      ))}

      {/* Tab Navigation */}
      <nav className="tab-nav fade-in">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="tab-content">
        {activeTab === "overview" && (
          <OverviewTab
            feedings={data.feedings}
            weeklyFeedings={data.weeklyFeedings}
            sleepEntries={data.sleepEntries}
            weeklySleep={data.weeklySleep}
            changes={data.changes}
            tummyTimes={data.tummyTimes}
            weeklyTummyTimes={data.weeklyTummyTimes}
            onEditEntry={(type, entry) => setModal({ type, entry })}
          />
        )}
        {activeTab === "growth" && (
          <GrowthTab
            weights={data.weights}
            heights={data.heights}
            monthlyFeedings={data.monthlyFeedings}
            monthlySleep={data.monthlySleep}
          />
        )}
      </main>

      {/* Quick Action FAB */}
      <div className="fab-container">
        {showActions && (
          <div className="fab-menu fade-in">
            {ACTION_GROUPS.map((group) => {
              const isOpen = expandedGroup === group.label;
              return (
                <div key={group.label} className="fab-group">
                  <button
                    className={`fab-group-label${isOpen ? " fab-group-label-active" : ""}`}
                    onClick={() => setExpandedGroup(isOpen ? null : group.label)}
                  >
                    {group.label}
                  </button>
                  {isOpen && (
                    <div className="fab-group-items">
                      {group.actions.map((action) => (
                        <button
                          key={action.id}
                          className="fab-action"
                          onClick={() => {
                            setModal({ type: action.id });
                            setShowActions(false);
                          }}
                        >
                          <span
                            className="fab-action-icon"
                            style={{ background: `${action.color}18`, color: action.color }}
                          >
                            {action.icon}
                          </span>
                          <span className="fab-action-label">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {showTimerPicker && (
          <div className="fab-menu fade-in" style={{ right: 76 }}>
            {TIMER_TYPES.map((t) => (
              <button
                key={t.id}
                className="fab-action"
                onClick={() => {
                  timer.startTimer(t.id);
                  setShowTimerPicker(false);
                }}
              >
                <span
                  className="fab-action-icon"
                  style={{ background: `${t.color}18`, color: t.color }}
                >
                  {t.icon}
                </span>
                <span className="fab-action-label">{t.label}</span>
              </button>
            ))}
          </div>
        )}
        <TimerButton
          label="Timer"
          icon={<Icons.Timer />}
          color={colors.feeding}
          active={false}
          onClick={() => {
            setShowTimerPicker(!showTimerPicker);
            setShowActions(false);
          }}
        />
        <button
          className="fab-btn"
          style={{ background: showActions ? "var(--text-muted)" : colors.feeding }}
          onClick={() => { setShowActions(!showActions); setShowTimerPicker(false); setExpandedGroup("Track"); }}
        >
          <span style={{ transform: showActions ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "flex" }}>
            <Icons.Plus />
          </span>
        </button>
      </div>

      {/* Modals */}
      {modal?.type === "feeding" && (
        <FeedingForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "sleep" && (
        <SleepForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "diaper" && (
        <DiaperForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "temp" && (
        <TemperatureForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "tummy" && (
        <TummyTimeForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "weight" && (
        <WeightForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "height" && (
        <HeightForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "note" && (
        <NoteForm
          childId={data.child?.id}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
