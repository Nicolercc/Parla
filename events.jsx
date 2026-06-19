import React, { useState, useEffect } from 'react';

const { eventView, eventSchedule } = window.PARLA_EVENT_UTILS;

  // HH:MM:SS, prefixed with "Nd" when more than a day remains.
  function formatCountdown(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hh = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    const clock = hh + ':' + mm + ':' + ss;
    return days > 0 ? days + 'd ' + clock : clock;
  }

  function EventTimer({ schedule }) {
    if (!schedule || !schedule.timed) return null;
    const upcoming = schedule.phase === 'upcoming';
    return (
      <span className={'event-timer' + (upcoming ? ' event-timer--soon' : '')} role="timer">
        <span className="event-timer-dot" aria-hidden="true" />
        {schedule.capLabel} {formatCountdown(schedule.remainingSec)}
      </span>
    );
  }

  function RewardLabel({ reward }) {
    return (
      <span className="event-reward">
        <span className="event-reward-cap">Reward</span>
        <span className="event-reward-val">{reward.label}</span>
      </span>
    );
  }

  function SimpleProgress({ view, tone }) {
    return (
      <div className="event-progress">
        <div className="event-track">
          <div
            className={'event-fill' + (tone ? ' event-fill--' + tone : '')}
            style={{ width: view.pct + '%' }}
            role="progressbar"
            aria-valuenow={view.current}
            aria-valuemin={0}
            aria-valuemax={view.target}
          />
        </div>
        <span className="event-count">{view.current}/{view.target}</span>
      </div>
    );
  }

  // Single CTA for a non-tiered event: locked / play / chest / claimed / in-progress.
  function SimpleClaim({ view, event, justClaimed, onOpen, onPlay, big }) {
    if (!view.open) return <span className="event-claim event-claim--off">🔒 Locked</span>;
    if (view.claimed) {
      return <span className={'event-claimed' + (justClaimed ? ' event-claimed--pop' : '')}>Claimed ✓</span>;
    }
    if (view.claimable) {
      return (
        <button
          type="button"
          className={'event-chest' + (big ? ' event-chest--big' : '')}
          onClick={() => onOpen(view.claimKey, event.reward)}
        >
          <span className="event-chest-lid" aria-hidden="true">🎁</span>
          Open
        </button>
      );
    }
    if (view.playable) {
      return (
        <button
          type="button"
          className={'event-play' + (big ? ' event-play--big' : '')}
          onClick={() => onPlay(event.lessonId)}
        >
          ▶ Play
        </button>
      );
    }
    return <span className="event-claim event-claim--off">In progress</span>;
  }

  // Milestone ladder: a marked progress track plus a row of claimable tiers.
  function TierTrack({ view }) {
    return (
      <div className="event-progress">
        <div className="event-track event-track--tiered">
          <div className="event-fill" style={{ width: view.pct + '%' }} />
          {view.tiers.map((tier) => (
            <span
              key={tier.at}
              className={'tier-mark' + (tier.reached ? ' tier-mark--on' : '')}
              style={{ left: (tier.at / view.maxAt) * 100 + '%' }}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="event-count">{view.value}/{view.maxAt}</span>
      </div>
    );
  }

  function TierChips({ tiers, justClaimed, onOpen }) {
    return (
      <div className="tier-row">
        {tiers.map((tier) => {
          const state = tier.claimed ? 'done' : tier.claimable ? 'ready' : tier.reached ? 'reached' : 'locked';
          return (
            <div key={tier.at} className={'tier-chip tier-chip--' + state}>
              <span className="tier-medal" aria-hidden="true">{tier.medal}</span>
              <span className="tier-reward">{tier.reward.label}</span>
              {tier.claimed ? (
                <span className={'tier-state' + (justClaimed === tier.claimKey ? ' event-claimed--pop' : '')}>Claimed ✓</span>
              ) : tier.claimable ? (
                <button type="button" className="tier-claim" onClick={() => onOpen(tier.claimKey, tier.reward)}>
                  🎁 Open
                </button>
              ) : (
                <span className="tier-need">{tier.at} correct</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function HeroEvent({ event, view, justClaimed, onOpen, onPlay }) {
    return (
      <article className={'event-hero' + (view.open ? '' : ' event-hero--locked')}>
        <div className="event-hero-glow" aria-hidden="true" />
        <div className="event-hero-top">
          <span className="event-hero-art" aria-hidden="true">{event.icon}</span>
          <div className="event-hero-headings">
            <div className="event-hero-badges">
              <span className="event-badge">{event.badge || 'Special'}</span>
              <EventTimer schedule={view.schedule} />
            </div>
            <h2 className="event-hero-title font-display">{event.title}</h2>
            <p className="event-hero-desc">{event.description}</p>
          </div>
        </div>
        <SimpleProgress view={view} tone="hero" />
        <div className="event-foot">
          <RewardLabel reward={event.reward} />
          <SimpleClaim view={view} event={event} justClaimed={justClaimed === view.claimKey} onOpen={onOpen} onPlay={onPlay} big />
        </div>
      </article>
    );
  }

  function EventCard({ event, view, justClaimed, onOpen, onPlay }) {
    const locked = !view.open;
    return (
      <article className={'event-card' + (locked ? ' event-card--locked' : '')}>
        <div className="event-top">
          <span className="event-icon" aria-hidden="true">{event.icon}</span>
          <div className="event-head">
            <div className="event-title-row">
              <h3 className="event-title">{event.title}</h3>
              {event.kind === 'special' && <span className="event-badge">{event.badge || 'Special'}</span>}
              <EventTimer schedule={view.schedule} />
            </div>
            <p className="event-desc">{event.description}</p>
          </div>
        </div>

        {view.tiered ? (
          <>
            <TierTrack view={view} />
            <TierChips tiers={view.tiers} justClaimed={justClaimed} onOpen={onOpen} />
          </>
        ) : (
          <>
            <SimpleProgress view={view} />
            <div className="event-foot">
              <RewardLabel reward={event.reward} />
              <SimpleClaim view={view} event={event} justClaimed={justClaimed === view.claimKey} onOpen={onOpen} onPlay={onPlay} />
            </div>
          </>
        )}
      </article>
    );
  }

  function EventTabScreen({ account, onClaim, onPlay, now }) {
    const Confetti = window.Confetti;
    const [justClaimed, setJustClaimed] = useState(null);

    useEffect(() => {
      if (!justClaimed) return undefined;
      const timer = setTimeout(() => setJustClaimed(null), 1700);
      return () => clearTimeout(timer);
    }, [justClaimed]);

    const handleOpen = (claimKey, reward) => {
      onClaim(claimKey, reward);
      setJustClaimed(claimKey);
    };

    const events = window.PARLA_EVENTS;
    const featured = events.find((e) => e.featured);
    const rest = events.filter((e) => !e.featured);

    return (
      <div className="screen events screen-fade">
        {Confetti && <Confetti run={!!justClaimed} />}
        <header className="events-head">
          <h1 className="events-title font-display">Events</h1>
          <p className="events-sub">Limited-time challenges for extra rewards.</p>
        </header>
        <div className="events-scroll">
          {featured && (
            <HeroEvent
              event={featured}
              view={eventView(account, featured, now)}
              justClaimed={justClaimed}
              onOpen={handleOpen}
              onPlay={onPlay}
            />
          )}
          {rest.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              view={eventView(account, event, now)}
              justClaimed={justClaimed}
              onOpen={handleOpen}
              onPlay={onPlay}
            />
          ))}
        </div>
      </div>
    );
  }

  // Bottom tab bar — shown only on the home phase, never during quiz/onboarding.
  function BottomNav({ activeTab, onSelect, hasEventAlert }) {
    const tabs = [
      { id: 'learn', icon: '🏠', label: 'Learn' },
      { id: 'events', icon: '🎁', label: 'Events', alert: hasEventAlert },
    ];
    return (
      <nav className="tabbar" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={'tabbar-btn ' + (activeTab === tab.id ? 'tabbar-btn--on' : '')}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => onSelect(tab.id)}
          >
            <span className="tabbar-icon">
              {tab.icon}
              {tab.alert && <span className="tabbar-dot" aria-hidden="true" />}
            </span>
            <span className="tabbar-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    );
  }

Object.assign(window, { BottomNav, EventTabScreen, EventCard });
