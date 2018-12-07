
export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const cancelActionIfNeeded  = value => value ? value : Promise.reject(false);
