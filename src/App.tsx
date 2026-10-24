import React, { useState, useEffect, useCallback } from 'react';
import {
  UserSettings,
  WorkoutSession,
  MeasurementEntry,
  ProgressPhoto,
  QuestItem,
  ExerciseDefinition,
} from './domain/types';
import {
  SettingsRepo,
  MeasurementsRepo,
  WorkoutsRepo,
  PhotosRepo,
  QuestsRepo,
  ExercisesRepo,
} from './db/repositories';
import { calculateSystemXP } from './domain/math';
import { SystemHeader } from './components/layout/SystemHeader';
import { DesktopSidebar, NavTabId } from './components/layout/DesktopSidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DashboardModule } from './features/dashboard/DashboardModule';
import { MeasurementsModule } from './features/measurements/MeasurementsModule';
import { WorkoutsModule } from './features/workouts/WorkoutsModule';
import { PhotosModule } from './features/photos/PhotosModule';
import { AnalyticsModule } from './features/analytics/AnalyticsModule';
import { QuestsModule } from './features/quests/QuestsModule';
import { SettingsModule } from './features/settings/SettingsModule';

export const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<NavTabId>('dashboard');

  // Application Data State
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);

  // Global Quick Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

  // Load all local data from Dexie IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      const [
        loadedSettings,
        loadedWorkouts,
        loadedMeasurements,
        loadedPhotos,
        loadedQuests,
        loadedExercises,
      ] = await Promise.all([
        SettingsRepo.get(),
        WorkoutsRepo.getAll(),
        MeasurementsRepo.getAll(),
        PhotosRepo.getAll(),
        QuestsRepo.getAll(),
        ExercisesRepo.getAll(),
      ]);

      setSettings(loadedSettings);
      setWorkouts(loadedWorkouts);
      setMeasurements(loadedMeasurements);
      setPhotos(loadedPhotos);
      setQuests(loadedQuests);
      setExercises(loadedExercises);
    } catch (err) {
      console.error('Failed to load system database records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Derived Rank & Progression
  const rankInfo = calculateSystemXP(workouts, quests, measurements);
  const uncompletedQuestsCount = quests.filter((q) => q.type === 'daily' && !q.completed).length;

  // Handlers for Workouts
  const handleSaveWorkout = async (
    workout: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => {
    if (idToUpdate) {
      await WorkoutsRepo.update(idToUpdate, workout);
    } else {
      await WorkoutsRepo.create(workout);
    }
    await refreshAllData();
  };

  const handleDeleteWorkout = async (id: string) => {
    await WorkoutsRepo.delete(id);
    await refreshAllData();
  };

  const handleLogRecoveryDay = async (date: string, notes?: string) => {
    await WorkoutsRepo.logRecoveryDay(date, notes);
    await refreshAllData();
  };

  // Handlers for Measurements
  const handleSaveMeasurement = async (
    entry: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => {
    if (idToUpdate) {
      await MeasurementsRepo.update(idToUpdate, entry);
    } else {
      await MeasurementsRepo.create(entry);
    }
    await refreshAllData();
  };

  const handleDeleteMeasurement = async (id: string) => {
    await MeasurementsRepo.delete(id);
    await refreshAllData();
  };

  // Handlers for Photos
  const handleUploadPhoto = async (
    photo: Omit<ProgressPhoto, 'id' | 'createdAt'>
  ) => {
    await PhotosRepo.create(photo);
    await refreshAllData();
  };

  const handleDeletePhoto = async (id: string) => {
    await PhotosRepo.delete(id);
    await refreshAllData();
  };

  // Handlers for Quests
  const handleToggleQuest = async (id: string) => {
    await QuestsRepo.toggleComplete(id);
    await refreshAllData();
  };

  const handleSaveQuest = async (
    quest: Omit<QuestItem, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => {
    if (idToUpdate) {
      await QuestsRepo.update(idToUpdate, quest);
    } else {
      await QuestsRepo.create(quest);
    }
    await refreshAllData();
  };

  const handleDeleteQuest = async (id: string) => {
    await QuestsRepo.delete(id);
    await refreshAllData();
  };

  // Exercise Handler
  const handleCreateExercise = async (
    ex: Omit<ExerciseDefinition, 'id'>
  ): Promise<ExerciseDefinition> => {
    const created = await ExercisesRepo.create(ex);
    await refreshAllData();
    return created;
  };

  // Settings Handler
  const handleUpdateSettings = async (patch: Partial<UserSettings>) => {
    const updated = await SettingsRepo.update(patch);
    setSettings(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-void flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-solo-blue border-t-transparent animate-spin rounded-sm mb-4" />
        <div className="font-display font-bold uppercase tracking-widest text-xs text-white">
          AWAKENING SYSTEM HUD // LOADING LOCAL VAULT
        </div>
        <div className="text-[10px] font-mono text-ayanokoji-muted mt-1">
          Synchronizing IndexedDB tables...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-obsidian-void text-ayanokoji-slate bg-tactical-grid flex flex-col ${settings?.reducedMotion ? 'motion-reduce' : ''}`}>
      {/* Top Tactical Status Header */}
      <SystemHeader
        settings={settings}
        rankInfo={rankInfo}
        onLogRecoveryDay={() => handleLogRecoveryDay(new Date().toISOString().slice(0, 10))}
        onQuickWorkout={() => {
          setCurrentTab('workouts');
          setIsWorkoutModalOpen(true);
        }}
      />

      {/* Main Structural Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Desktop Sidebar (>= 1024px) */}
        <DesktopSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          uncompletedQuestsCount={uncompletedQuestsCount}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-full overflow-hidden">
          {currentTab === 'dashboard' && (
            <DashboardModule
              settings={settings}
              rankInfo={rankInfo}
              workouts={workouts}
              measurements={measurements}
              quests={quests}
              onNavigate={setCurrentTab}
              onOpenWorkoutModal={() => {
                setCurrentTab('workouts');
                setIsWorkoutModalOpen(true);
              }}
              onOpenMeasurementModal={() => {
                setCurrentTab('measurements');
                setIsMeasurementModalOpen(true);
              }}
              onToggleQuest={handleToggleQuest}
            />
          )}

          {currentTab === 'measurements' && (
            <MeasurementsModule
              measurements={measurements}
              settings={settings}
              onSaveMeasurement={handleSaveMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              isOpenModal={isMeasurementModalOpen}
              onCloseModal={() => setIsMeasurementModalOpen(false)}
              onOpenModal={() => setIsMeasurementModalOpen(true)}
            />
          )}

          {currentTab === 'workouts' && (
            <WorkoutsModule
              workouts={workouts}
              exercises={exercises}
              settings={settings}
              onSaveWorkout={handleSaveWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onCreateExercise={handleCreateExercise}
              isOpenModal={isWorkoutModalOpen}
              onCloseModal={() => setIsWorkoutModalOpen(false)}
              onOpenModal={() => setIsWorkoutModalOpen(true)}
              onLogRecoveryDay={handleLogRecoveryDay}
            />
          )}

          {currentTab === 'photos' && (
            <PhotosModule
              photos={photos}
              measurements={measurements}
              onUploadPhoto={handleUploadPhoto}
              onDeletePhoto={handleDeletePhoto}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsModule
              workouts={workouts}
              measurements={measurements}
              exercises={exercises}
              settings={settings}
            />
          )}

          {currentTab === 'quests' && (
            <QuestsModule
              quests={quests}
              rankInfo={rankInfo}
              workouts={workouts}
              measurements={measurements}
              onToggleQuest={handleToggleQuest}
              onSaveQuest={handleSaveQuest}
              onDeleteQuest={handleDeleteQuest}
              onLogRecoveryDay={handleLogRecoveryDay}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsModule
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Mobile 5-Slot Thumb Navigation Bar (< 1024px) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        uncompletedQuestsCount={uncompletedQuestsCount}
      />
    </div>
  );
};
