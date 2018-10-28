
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const cancelActionIfNeeded  = value => value? value : Promise.reject(false);