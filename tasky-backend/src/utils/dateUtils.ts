// Calculates the time difference in milliseconds until the job should run
export const calculateDelay = (futureDate: Date): number => {
  //future date is the scheduledRunTime
  const now = Date.now();
  const futureTime = futureDate.getTime();

  // Returns the difference, or 0 if the time is already in the past
  return Math.max(0, futureTime - now);
};
