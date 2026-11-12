import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { Step1Welcome } from './Step1Welcome';
import { Step2Sports } from './Step2Sports';
import { Step3Teams } from './Step3Teams';
import { Step4Experience } from './Step4Experience';
import { Step5Location } from './Step5Location';
import { Step6Notifications } from './Step6Notifications';
import { Step7Profile } from './Step7Profile';
import { StepCompletion } from './StepCompletion';
import { TeamReference, UserIntent, PermissionStatus, NotificationPreferences } from '../../types';

// A fresh component instance per authenticated identity prevents unsaved
// onboarding selections from one account surviving an account switch.
export const OnboardingFlow: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <OnboardingFlowForUser key={currentUser.id} />;
};

const OnboardingFlowForUser: React.FC = () => {
  const { currentUser, updateUser } = useAuth();

  // Local state to guarantee no loss of selections on backward navigation
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);

  const [selectedSports, setSelectedSports] = useState<string[]>(
    currentUser?.favoriteSports || []
  );
  const [selectedTeams, setSelectedTeams] = useState<TeamReference[]>(
    currentUser?.favoriteTeams || []
  );
  const [selectedExperiences, setSelectedExperiences] = useState<UserIntent[]>(
    currentUser?.preferredExperience || ['HIGH_ENERGY']
  );
  const [locationData, setLocationData] = useState<{
    homeCity: string;
    homeState: string;
    homeZip?: string;
    latitude?: number;
    longitude?: number;
    locationPermissionStatus: PermissionStatus;
  }>({
    homeCity: currentUser?.homeCity || 'Austin',
    homeState: currentUser?.homeState || 'TX',
    homeZip: currentUser?.homeZip || '78701',
    latitude: currentUser?.latitude || 30.2672,
    longitude: currentUser?.longitude || -97.7431,
    locationPermissionStatus: currentUser?.locationPermissionStatus || 'PROMPT'
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    currentUser?.notificationPreferences || {
      favoriteTeamGames: true,
      gameStartingSoon: true,
      gameNearYou: true,
      venueTrending: true,
      friendsCheckingIn: true,
      recommendations: true
    }
  );

  const [firstName, setFirstName] = useState(currentUser?.firstName || 'Sports Fan');
  const [username, setUsername] = useState(currentUser?.username || 'austin_fan');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.profilePhotoUrl || currentUser?.avatar || '');

  if (!currentUser) return null;

  // Toggle helpers
  const handleToggleSport = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  const handleToggleTeam = (team: TeamReference) => {
    setSelectedTeams((prev) =>
      prev.some((t) => t.id === team.id)
        ? prev.filter((t) => t.id !== team.id)
        : [...prev, team]
    );
  };

  const handleToggleExperience = (exp: UserIntent) => {
    setSelectedExperiences((prev) =>
      prev.includes(exp) ? prev.filter((e) => e !== exp) : [...prev, exp]
    );
  };

  const handleToggleNotification = (key: keyof NotificationPreferences) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEnableAllNotifications = () => {
    setNotificationPreferences({
      favoriteTeamGames: true,
      gameStartingSoon: true,
      gameNearYou: true,
      venueTrending: true,
      friendsCheckingIn: true,
      recommendations: true
    });
  };

  // Step transitions
  const goToNextStep = () => {
    // Persist current state incrementally
    updateUser({
      favoriteSports: selectedSports,
      favoriteTeams: selectedTeams,
      preferredExperience: selectedExperiences.length > 0 ? selectedExperiences : ['HIGH_ENERGY'],
      homeCity: locationData.homeCity,
      homeState: locationData.homeState,
      homeZip: locationData.homeZip,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationPermissionStatus: locationData.locationPermissionStatus,
      notificationPreferences,
      firstName,
      username,
      profilePhotoUrl: photoUrl,
      avatar: photoUrl || currentUser.avatar
    });

    setCurrentStepIndex((prev) => Math.min(prev + 1, 8));
  };

  const goToPrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 1));
  };

  const handleSkipToCompletion = () => {
    // Quick bypass: complete onboarding right away
    updateUser({
      favoriteSports: selectedSports,
      favoriteTeams: selectedTeams,
      preferredExperience: selectedExperiences,
      onboardingCompleted: true,
      onboardingStep: 'complete'
    });
  };

  const handleFinalCompletion = () => {
    updateUser({
      favoriteSports: selectedSports,
      favoriteTeams: selectedTeams,
      preferredExperience: selectedExperiences,
      homeCity: locationData.homeCity,
      homeState: locationData.homeState,
      homeZip: locationData.homeZip,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      notificationPreferences,
      firstName,
      username,
      profilePhotoUrl: photoUrl,
      onboardingCompleted: true,
      onboardingStep: 'complete'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-5 max-w-md mx-auto selection:bg-amber-500 selection:text-black">
      {/* Progress Bar (visible for steps 2 to 7) */}
      {currentStepIndex >= 2 && currentStepIndex <= 7 && (
        <OnboardingProgressBar
          currentStep={currentStepIndex - 1}
          totalSteps={6}
          onBack={goToPrevStep}
          onSkip={goToNextStep}
          canSkip={true}
          stepTitle={
            currentStepIndex === 2
              ? 'Sports'
              : currentStepIndex === 3
              ? 'Teams'
              : currentStepIndex === 4
              ? 'Vibe'
              : currentStepIndex === 5
              ? 'Location'
              : currentStepIndex === 6
              ? 'Notifications'
              : 'Profile'
          }
        />
      )}

      {/* Step Components */}
      <div className="flex-1 flex flex-col justify-center">
        {currentStepIndex === 1 && (
          <Step1Welcome
            user={currentUser}
            onNext={goToNextStep}
            onSkipAll={handleSkipToCompletion}
          />
        )}

        {currentStepIndex === 2 && (
          <Step2Sports
            selectedSports={selectedSports}
            onToggleSport={handleToggleSport}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        )}

        {currentStepIndex === 3 && (
          <Step3Teams
            selectedSports={selectedSports}
            selectedTeams={selectedTeams}
            onToggleTeam={handleToggleTeam}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        )}

        {currentStepIndex === 4 && (
          <Step4Experience
            selectedExperiences={selectedExperiences}
            onToggleExperience={handleToggleExperience}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        )}

        {currentStepIndex === 5 && (
          <Step5Location
            homeCity={locationData.homeCity}
            homeState={locationData.homeState}
            homeZip={locationData.homeZip}
            latitude={locationData.latitude}
            longitude={locationData.longitude}
            locationPermissionStatus={locationData.locationPermissionStatus}
            onChangeLocation={(data) => setLocationData(data)}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        )}

        {currentStepIndex === 6 && (
          <Step6Notifications
            preferences={notificationPreferences}
            onToggleCategory={handleToggleNotification}
            onEnableAll={handleEnableAllNotifications}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        )}

        {currentStepIndex === 7 && (
          <Step7Profile
            user={currentUser}
            firstName={firstName}
            username={username}
            photoUrl={photoUrl}
            favoriteTeams={selectedTeams}
            onChangeFirstName={setFirstName}
            onChangeUsername={setUsername}
            onChangePhotoUrl={setPhotoUrl}
            onNext={goToNextStep}
          />
        )}

        {currentStepIndex === 8 && (
          <StepCompletion user={currentUser} onFinish={handleFinalCompletion} />
        )}
      </div>
    </div>
  );
};
