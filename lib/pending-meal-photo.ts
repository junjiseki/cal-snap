let pendingMealPhoto: File | null = null;

export const PENDING_MEAL_PHOTO_EVENT = "cal-snap:pending-meal-photo";

export function setPendingMealPhoto(file: File) {
  pendingMealPhoto = file;
}

export function takePendingMealPhoto() {
  const file = pendingMealPhoto;
  pendingMealPhoto = null;
  return file;
}
