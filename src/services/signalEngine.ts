import {
  VenueSignal,
  Presence,
  VenueLiveState,
  SignalType,
  PresenceActivity
} from '../types';
import {
  SEEDED_SIGNALS,
  SEEDED_PRESENCE,
  INITIAL_LIVE_STATES
} from '../data/seedData';
import { isDemoMode } from '../config/dataMode';

class SignalEngine {
  private signals: VenueSignal[] = isDemoMode ? [...SEEDED_SIGNALS] : [];
  private presences: Presence[] = isDemoMode ? [...SEEDED_PRESENCE] : [];
  private liveStates: Record<string, VenueLiveState> = isDemoMode ? { ...INITIAL_LIVE_STATES } : {};
  private listeners: Array<() => void> = [];
  private simulationInterval: any = null;
  public isSimulating: boolean = isDemoMode;

  constructor() {
    this.cleanExpiredPresences();
    if (isDemoMode) this.startSimulation();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getSignals(venueId?: string): VenueSignal[] {
    if (venueId) {
      return this.signals.filter((s) => s.venueId === venueId);
    }
    return [...this.signals];
  }

  public getPresences(venueId?: string): Presence[] {
    this.cleanExpiredPresences();
    if (venueId) {
      return this.presences.filter((p) => p.venueId === venueId);
    }
    return [...this.presences];
  }

  public getLiveStates(): Record<string, VenueLiveState> {
    return { ...this.liveStates };
  }

  public getVenueLiveState(venueId: string): VenueLiveState | undefined {
    return this.liveStates[venueId];
  }

  /**
   * User check-in "I'M HERE" with expiration
   */
  public checkIn(
    userId: string,
    userName: string,
    userAvatar: string,
    venueId: string,
    activityType: PresenceActivity,
    statusMessage: string,
    durationHours: number = 2
  ): Presence {
    // Remove previous check-in for this user if exists
    this.presences = this.presences.filter((p) => p.userId !== userId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const newPresence: Presence = {
      id: `pres_${Date.now()}`,
      userId,
      userName,
      userAvatar,
      venueId,
      activityType,
      statusMessage: statusMessage || 'Watching the game',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.presences.unshift(newPresence);

    // Emit live signal
    this.addSignal({
      id: `sig_${Date.now()}`,
      venueId,
      signalType: 'CHECK_IN',
      title: `${userName} checked in`,
      message: statusMessage || 'Just arrived to watch the game',
      source: 'USER',
      confidence: 100,
      timestamp: 'Just now'
    });

    // Bump venue crowd & energy slightly
    if (this.liveStates[venueId]) {
      const current = this.liveStates[venueId];
      this.liveStates[venueId] = {
        ...current,
        crowd: Math.min(100, current.crowd + 2),
        energy: Math.min(100, current.energy + 2),
        social: Math.min(100, current.social + 3),
        seatingAvailability: Math.max(0, current.seatingAvailability - 2),
        trendingVelocity: current.trendingVelocity + 4,
        lastUpdated: new Date().toISOString()
      };
    }

    this.notify();
    return newPresence;
  }

  public checkOut(userId: string) {
    this.presences = this.presences.filter((p) => p.userId !== userId);
    this.notify();
  }

  public addSignal(signal: VenueSignal) {
    this.signals.unshift(signal);
    if (this.signals.length > 50) {
      this.signals = this.signals.slice(0, 50);
    }
    this.notify();
  }

  public cleanExpiredPresences() {
    const now = new Date().getTime();
    const originalLen = this.presences.length;
    this.presences = this.presences.filter((p) => new Date(p.expiresAt).getTime() > now);
    if (this.presences.length !== originalLen) {
      this.notify();
    }
  }

  /**
   * Real-time city simulation layer.
   * Modulates crowd, energy, trending velocity, and emits occasional crowd signals.
   */
  public toggleSimulation() {
    if (!isDemoMode) return;
    this.isSimulating = !this.isSimulating;
    if (this.isSimulating) {
      this.startSimulation();
    } else {
      if (this.simulationInterval) clearInterval(this.simulationInterval);
    }
    this.notify();
  }

  private startSimulation() {
    if (!isDemoMode) return;
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      if (!this.isSimulating) return;

      // Pick a random venue to fluctuate slightly
      const venueKeys = Object.keys(this.liveStates);
      const randomKey = venueKeys[Math.floor(Math.random() * venueKeys.length)];
      const current = this.liveStates[randomKey];

      if (current) {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newCrowd = Math.max(20, Math.min(99, current.crowd + delta));
        const newEnergy = Math.max(20, Math.min(99, current.energy + delta));
        const newVelocity = Math.max(0, current.trendingVelocity + (delta > 0 ? 1 : -1));

        this.liveStates[randomKey] = {
          ...current,
          crowd: newCrowd,
          energy: newEnergy,
          trendingVelocity: newVelocity,
          lastUpdated: new Date().toISOString()
        };
      }

      this.notify();
    }, 8000);
  }
}

export const signalEngine = new SignalEngine();
